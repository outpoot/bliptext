import xml.sax
import json
import logging
import time
import multiprocessing
from argparse import ArgumentParser
from multiprocessing import Process, Manager, Value
from typing import Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def default_ns_filter(ns: int) -> bool:
    """Default namespace filter (main articles)"""
    return ns == 0

def process_worker(aq: Any, fq: Any, shutdown: Value) -> None:
    """Process articles from input queue to output queue"""
    while not shutdown.value or not aq.empty():
        try:
            title, text = aq.get(timeout=1)
            fq.put(json.dumps({"title": title, "raw_text": text}, ensure_ascii=False))
        except Exception as e:
            if not shutdown.value:
                logger.debug(f"Queue error: {str(e)}")

def writer_worker(fq: Any, output_path: str, shutdown: Value) -> None:
    """Write results to output file"""
    with open(output_path, 'w', encoding='utf-8') as f:
        while not shutdown.value or not fq.empty():
            try:
                data = fq.get(timeout=1)
                f.write(data + '\n')
            except Exception as e:
                if not shutdown.value:
                    logger.debug(f"Write error: {str(e)}")

class WikiReader(xml.sax.ContentHandler):
    """SAX parser for Wikipedia XML dumps"""
    def __init__(self, 
               callback: Any, 
               page_count: Value,
               article_count: Value,
               ns_filter: Any = default_ns_filter):
        super().__init__()
        self.ns_filter = ns_filter
        self.current_tag = None
        self.current_text = []
        self.current_title = []
        self.current_ns = None
        self.callback = callback
        self.page_count = page_count
        self.article_count = article_count

    def startElement(self, name: str, attrs: Any) -> None:
        self.current_tag = name
        if name == "page":
            self.current_text = []
            self.current_title = []
            self.current_ns = None

    def endElement(self, name: str) -> None:
        if name == "page":
            with self.page_count.get_lock():
                self.page_count.value += 1
            
            if self.ns_filter(self.current_ns):
                title = "".join(self.current_title).strip()
                text = "".join(self.current_text).strip()
                self.callback((title, text))
                with self.article_count.get_lock():
                    self.article_count.value += 1

        self.current_tag = None

    def characters(self, content: str) -> None:
        if self.current_tag == "text":
            self.current_text.append(content)
        elif self.current_tag == "title":
            self.current_title.append(content)
        elif self.current_tag == "ns" and content.strip().isdigit():
            self.current_ns = int(content.strip())

def status_monitor(page_count: Value, 
                 article_count: Value, 
                 shutdown: Value) -> None:
    """Display progress updates"""
    start_time = time.time()
    while not shutdown.value:
        elapsed = time.time() - start_time
        logger.info(
            f"Pages: {page_count.value:,} | "
            f"Articles: {article_count.value:,} | "
            f"Elapsed: {elapsed//60:.0f}m{elapsed%60:.0f}s"
        )
        time.sleep(5)

if __name__ == "__main__":
    parser = ArgumentParser(description="Wikipedia XML to JSONL converter")
    parser.add_argument("--input", required=True, help="Input XML file")
    parser.add_argument("--output", required=True, help="Output JSONL file")
    parser.add_argument("--workers", type=int, 
                      default=multiprocessing.cpu_count(),
                      help="Number of worker processes")
    args = parser.parse_args()

    manager = Manager()
    aq = manager.Queue(maxsize=1000)
    fq = manager.Queue(maxsize=1000)
    shutdown = Value('b', False)
    page_count = Value('i', 0)
    article_count = Value('i', 0)

    writer = Process(target=writer_worker, args=(fq, args.output, shutdown))
    writer.start()

    processors = [
        Process(target=process_worker, args=(aq, fq, shutdown))
        for _ in range(args.workers)
    ]
    for p in processors:
        p.start()

    status = Process(target=status_monitor, 
                   args=(page_count, article_count, shutdown))
    status.start()

    try:
        def xml_callback(page: tuple) -> None:
            aq.put(page)

        parser = xml.sax.make_parser()
        handler = WikiReader(
            callback=xml_callback,
            page_count=page_count,
            article_count=article_count,
            ns_filter=default_ns_filter
        )
        parser.setContentHandler(handler)

        logger.info(f"Processing {args.input} with {args.workers} workers...")
        with open(args.input, 'r', encoding='utf-8') as f:
            parser.parse(f)

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
    finally:
        logger.info("Shutting down...")
        shutdown.value = True

        for p in processors:
            if p.is_alive():
                p.join(timeout=5)
        if writer.is_alive():
            writer.join(timeout=5)
        if status.is_alive():
            status.join(timeout=5)

    logger.info(f"Completed processing. Results saved to {args.output}")