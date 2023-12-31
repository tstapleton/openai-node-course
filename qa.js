import { openai } from './openai.js';
import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { CharacterTextSplitter, TextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';

const question = process.argv[2] || 'hi';

const video = `https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn`;

function createStore(docs) {
	return MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());
}

function docsFromYouTubeVideo(video) {
	const loader = YoutubeLoader.createFromUrl(video, {
		language: 'en',
		addVideoInfo: true,
	});
	return loader.loadAndSplit(
		new CharacterTextSplitter({
			separator: ' ',
			chunkSize: 2500,
			chunkOverlap: 100,
		})
	);
}

function docsFromPdf() {
	const loader = new PDFLoader('./xbox.pdf');
	return loader.loadAndSplit(
		new CharacterTextSplitter({
			separator: '. ',
			chunkSize: 2500,
			chunkOverlap: 200,
		})
	);
}

async function loadStore() {
	const videoDocs = await docsFromYouTubeVideo(video);
	const pdfDocs = await docsFromPdf();

	return createStore([...videoDocs, ...pdfDocs]);
}

async function query() {
	const store = await loadStore();
	const results = await store.similaritySearch(question, 2);

	const response = await openai.chat.completions.create({
		model: 'gpt-4',
		temperature: 0,
		messages: [
			{
				role: 'system',
				content:
					'You are a helpful AI assistant. Answer questions to the best of your ability.',
			},
			{
				role: 'user',
				content: `
					Answer the following question using the provided context. If you cannot answer the question with the context, don't like and make up stuff. Just say you need more context.
					Question ${question}
					Context: ${results.map((r) => r.pageContent).join('\n')}
				`,
			},
		],
	});

	console.log(
		`Answer ${response.choices[0].message.content}\nSources: ${results
			.map((r) => r.metadata.source)
			.join(', ')}`
	);
}

query();
