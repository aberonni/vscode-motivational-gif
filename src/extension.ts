'use strict';

import * as vscode from 'vscode';
import TextDocumentContentProvider from './content-provider';

function getGifsFromLibrary(): Array<string> {
	const gifLibrary = vscode.workspace.getConfiguration('motivateMe')['gifLibrary'];

	if (gifLibrary.length === 0) {
		return [];
	}

	const validGifs = gifLibrary.filter(gif => gif.endsWith('.gif'));

	if (validGifs.length === 0) {
		vscode.window.showWarningMessage('No valid GIFs found in motivateMe.gifLibrary option. Make sure that all gifs end with the .gif extension.')
		return [];
	} else if (validGifs.length < gifLibrary.length) {
		vscode.window.showWarningMessage('Some invalid GIFs found in motivateMe.gifLibrary option. Make sure that all gifs end with the .gif extension.')
	}

	return validGifs;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-motivational-gif activated.');
	
	const previewUri = vscode.Uri.parse('motivational-gif://authority/motivational-gif');

	const provider = new TextDocumentContentProvider(context, getGifsFromLibrary());
	const registration = vscode.workspace.registerTextDocumentContentProvider('motivational-gif', provider);
	
	vscode.workspace.onDidChangeConfiguration(() => {
		provider.udpateLibrary(getGifsFromLibrary());
	});

	const disposable = vscode.commands.registerCommand('extension.motivateMe', () => {
		let col = vscode.ViewColumn.Two;

		if (vscode.window.activeTextEditor &&
			vscode.window.activeTextEditor.viewColumn === vscode.ViewColumn.Two) {
			col = vscode.ViewColumn.One;
		}

		return vscode.commands.executeCommand('vscode.previewHtml', previewUri, col, 'Motivational GIF').then((success) => {
            console.log('Succesfully opened motivational GIF window.');
		}, (reason) => {
			vscode.window.showErrorMessage(reason);
		});
	});

	context.subscriptions.push(disposable, registration);
}

export function deactivate() {
}