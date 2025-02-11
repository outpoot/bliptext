import { checkHardcore } from '$lib/shared/moderation';
import { isValidWord } from '$lib/shared/wordMatching';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const { word } = await request.json();
        if (!word || typeof word !== 'string') {
            return json({ error: 'Invalid input' }, { status: 400 });
        }

        const isValid = isValidWord(word);
        const isSuckish = checkHardcore(word);

        if (!isValid || isSuckish) {
            return json({ error: 'Invalid word' }, { status: 400 });
        }

        return json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Word validation error:', error);
        return json({ error: 'Server error' }, { status: 500 });
    }
}
