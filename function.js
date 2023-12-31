import 'dotenv/config';
import { openai } from './openai.js';
import math from 'advanced-calculator';

const question = process.argv[2] || 'hi';

const messages = [{ role: 'user', content: question }];

const functions = {
	calculate({ expression }) {
		return math.evaluate(expression);
	},
	async generateImage({ prompt }) {
		const result = await openai.images.generate({ prompt });
		console.log(`Image prompt: ${prompt}`);
		console.log(result);
		return '';
	},
};

async function getCompletions(message) {
	return openai.chat.completions.create({
		model: 'gpt-3.5-turbo-0613',
		messages,
		functions: [
			{
				name: 'calculate',
				description: 'Run a math expression',
				parameters: {
					type: 'object',
					properties: {
						expression: {
							type: 'string',
							description:
								'The math expression to evaluate like "2 * 3 + (21 / 2)^2"',
						},
					},
				},
				required: ['expression'],
			},
			{
				name: 'generateImage',
				description: 'Create or generate image based on a description',
				parameters: {
					type: 'object',
					properties: {
						prompt: {
							type: 'string',
							description: 'The description of the image to generate',
						},
					},
				},
				required: ['prompt'],
			},
		],
		temperature: 0,
	});
}

let response;
while (true) {
	response = await getCompletions(messages);

	if (response.choices[0].finish_reason === 'stop') {
		console.log(response.choices[0].message.content);
		break;
	}
	if (response.choices[0].finish_reason === 'function_call') {
		const fn = response.choices[0].message.function_call.name;
		const args = response.choices[0].message.function_call.arguments;

		const result = functions[fn](JSON.parse(args));

		messages.push({
			role: 'assistant',
			content: null,
			function_call: {
				name: fn,
				arguments: args,
			},
		});
		messages.push({
			role: 'function',
			name: fn,
			content: JSON.stringify({ result }),
		});
	}
}
