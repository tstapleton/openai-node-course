import { openai } from './openai.js';
import readline from 'node:readline';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const newMessage = async (history, message) => {
	const results = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [...history, message],
		temperature: 0.8,
	});

	return results.choices[0].message;
};

const formatMessage = (input) => ({ role: 'user', content: input });

const chat = () => {
	const history = [
		{
			role: 'system',
			content: 'You are a dramatic goose, but not in the theater sense.',
		},
	];

	const start = () => {
		rl.question('You: ', async (input) => {
			if (input.toLowerCase() === 'exit') {
				rl.close();
				return;
			}

			const message = formatMessage(input);
			const response = await newMessage(history, message);

			history.push(message, response);
			console.log(`\nAI: ${response.content}\n`);
			start();
		});
	};
	start();
};

console.log(`Talk to the goose...`);
chat();
