import * as os from "os";
import * as path from "path";
import * as vscode from 'vscode';
import { WorkspaceConfiguration } from "vscode";

export default class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
    constructor(context: vscode.ExtensionContext, gifLibrary: Array<string>) {
        this.context = context;
        this.gifLibrary = gifLibrary;
    }

    public udpateLibrary(gifLibrary: Array<string>) {
        this.gifLibrary = gifLibrary;
    }

    private context: vscode.ExtensionContext;
    private gifLibrary: Array<string>;

    private getImage(image: string): string {
        let imagePath = this.context.asAbsolutePath(path.join('images', image));

        if (os.type() === 'WINDOWS_NT') {
            imagePath = imagePath.split('\\').join('/');
        } else {
            imagePath = `file://${imagePath}`;
        }

        return imagePath;
    }

    private getGifFromLibrary(): string {
        if (!this.gifLibrary || this.gifLibrary.length === 0) {
            return null;
        }
        return this.gifLibrary[Math.floor(Math.random() * this.gifLibrary.length)];
    }

    public provideTextDocumentContent(uri: vscode.Uri): any {
        const apiURL = 'https://vscode-motivational-gif.herokuapp.com/';
        let gifLoaderCode;

        const customGif = this.getGifFromLibrary();

        if (customGif) {
            gifLoaderCode = `
                loadGif({
                    image_original_url: '${customGif}',
                    url: '${customGif}'
                });
            `;
        } else {
            // user does not have any valid gifs in library
            // inject one via API
            gifLoaderCode = `
                xmlHttp.addEventListener('load', () => {
                    let data;
                    try {
                        // if API response correctly we can extract gif from data
                        data = JSON.parse(xmlHttp.responseText).data;
                    } catch (e) {
                        // otherwise use fallback gif
                        data = {
                            image_original_url: '${this.getImage('fallback.gif')}',
                            url: 'https://giphy.com/gifs/reaction-qDPg6HNz2NfAk'
                        }
                    }
                    loadGif(data);
                });
                
                xmlHttp.open("GET", '${apiURL}', true);
                xmlHttp.send(null);
            `;
        }

        return `
            <style>
                html, body {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                }
                body {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background-image: url('${this.getImage('spinner.gif')}');
                    background-position: 50% 50%;
                    background-size: 30px;
                    background-repeat: no-repeat;
                }
                #gif {
                    flex: 0 1 auto;
                }
                #powered-by {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                }
                #gif-link {
                    text-decoration: none;
                    margin-top: 5px;
                }
                a:not([href]) {
                    display: none;
                }
            </style>
            <body>
                <a href="http://giphy.com" id="powered-by">
                    <img src="${this.getImage('powered-by.gif')}" crossorigin="anonymous" />
                </a>
                <img id="gif" />
                <a id="gif-link">Open GIF in browser</a>
                <script>
                    const gif = document.getElementById('gif');
                    const gifLink = document.getElementById('gif-link');
                    const xmlHttp = new XMLHttpRequest();

                    function loadGif (data) {
                        gif.src = data.image_original_url;
                        gifLink.setAttribute('href', data.url);
                    }

                    ${gifLoaderCode}
                </script>
            </body>`;
    }
}
