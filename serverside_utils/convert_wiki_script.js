import fs from 'fs';
import path from 'path';
import convertWikiToMD from './wikipedia_to_blip';

const inputFilePath = path.resolve(__dirname, 'input.txt');
const outputFilePath = path.resolve(__dirname, 'output.md');

fs.readFile(inputFilePath, 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading input file:', err);
        return;
    }

    try {
        const markdown = await convertWikiToMD(data);
        fs.writeFile(outputFilePath, markdown, 'utf8', (err) => {
            if (err) {
                console.error('Error writing output file:', err);
            } else {
                console.log('Conversion successful! Output written to output.md');
            }
        });
    } catch (error) {
        console.error('Error converting wiki text to markdown:', error);
    }
});
