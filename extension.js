const vscode = require('vscode');
const axios = require('axios');

function activate(context) {
    // Function to create the HTML content for your webview view
    function createConfigViewWebview() {
        const webViewProvider = {
            resolveWebviewView(webviewView) {
                webviewView.webview.options = {
                    enableScripts: true,
                };

                webviewView.webview.html = getWebviewContent();

                webviewView.webview.onDidReceiveMessage(async (message) => {
                    switch (message.type) {
                        case 'loadConfig':
                            const apiKey = context.globalState.get('chatgptApiKey', '');
                            const configSettings = context.globalState.get('codeConfig', {
                                "generate-comments": false,
                                "fix-bugs": false,
                                "optimize-code": false,
                                "generate-tests": false
                            });
                            webviewView.webview.postMessage({ type: 'apiKeyLoaded', apiKey });
                            break;
                        case 'updateApiKey':
                            const newApiKey = await vscode.window.showInputBox({ prompt: 'Enter new API key', value: context.globalState.get('chatgptApiKey', '') });
                            if (newApiKey !== undefined) {
                                context.globalState.update('chatgptApiKey', newApiKey);
                                vscode.window.showInformationMessage('API key updated');
                            }
                            break;
                        case 'deleteApiKey':
                            const userResponse = await vscode.window.showInformationMessage(
                                'Do you want to proceed?',
                                { modal: true },
                                'Yes',
                                'No'
                            );
                            if (userResponse === 'Yes') {
                                context.globalState.update('chatgptApiKey', '');
                                vscode.window.showInformationMessage('API key deleted');
                            }
                            break;
                        case 'checkboxChange':
                            const configUpdate = context.globalState.get('codeConfig', {
                                "generate-comments": false,
                                "fix-bugs": false,
                                "optimize-code": false,
                                "generate-tests": false
                            });
                            configUpdate[message.id] = message.checked
                            context.globalState.update('codeConfig', configUpdate);
                            vscode.window.showInformationMessage(`Checkbox ${message.id} changed to ${message.checked}`);
                            break;
                    }
                });
            }
        };

        return webViewProvider;
    }

    // Function to retrieve the HTML content for the webview
    function getWebviewContent() {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(context.extensionPath, 'webview.html');
        return fs.readFileSync(filePath, 'utf8');
    }

    // Register the webview provider for the configuration view
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("code-plus-plus.configView", createConfigViewWebview())
    );

    // Register the command to open the configuration view
    const disposable = vscode.commands.registerCommand('code-plus-plus.openConfigView', function () {
        const panel = vscode.window.createWebviewPanel(
            'configView',
            'Configuration View',
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'loadApiKey':
                    const apiKey = context.globalState.get('chatgptApiKey', '');
                    vscode.window.showInformationMessage(`API key updated ${apiKey}`);
                    panel.webview.postMessage({ type: 'apiKeyLoaded', apiKey });
                    break;
                case 'updateApiKey':
                    const newApiKey = await vscode.window.showInputBox({ prompt: 'Enter new API key', value: context.globalState.get('chatgptApiKey', '') });
                    if (newApiKey !== undefined) {
                        context.globalState.update('chatgptApiKey', newApiKey);
                        vscode.window.showInformationMessage(`API key updated`);
                    }
                    break;
                case 'deleteApiKey':
                    const userResponse = await vscode.window.showInformationMessage(
                        'Do you want to delete your ChatGPT API Key?',
                        { modal: true },
                        'Yes',
                        'No'
                    );
                    if (userResponse === 'Yes') {
                        context.globalState.update('chatgptApiKey', '');
                        vscode.window.showInformationMessage('API key deleted');
                    }
                    break;
                case 'checkboxChange':
                    vscode.window.showInformationMessage(`Checkbox ${message.id} changed to ${message.checked}`);
                    break;
            }
        });
    });

    // Register the command to handle editor text input
    const editorInputDisposable = vscode.commands.registerTextEditorCommand('extension.triggerCodePlusPlus', async (textEditor, edit) => {
        const document = textEditor.document;
        const text = document.getText().trim().toLowerCase();
        
        if (text === '// code++') {
            const apiKey = context.globalState.get('chatgptApiKey', '');

            if (!apiKey) {
                vscode.window.showErrorMessage('API Key not set. Please set your ChatGPT API Key.');
                return;
            }

            const configSettings = context.globalState.get('codeConfig', {
                "generate-comments": false,
                "fix-bugs": false,
                "optimize-code": false,
                "generate-tests": false
            });

            if (!configSettings['generate-comments'] && !configSettings['fix-bugs'] && !configSettings['optimize-code'] && !configSettings['generate-tests']) {
                vscode.window.showErrorMessage('No code config settings enabled. Please enable at least one option.');
                return;
            }

            // Example: Execute different API calls based on codeConfig settings
            if (configSettings['generate-comments']) {
                try {
                    // Example API call using axios
                    const response = await axios.post('https://api.example.com/generate-comments', { apiKey });
                    vscode.window.showInformationMessage('Generated comments successfully.');
                } catch (error) {
                    vscode.window.showErrorMessage('Error generating comments: ' + error.message);
                }
            }

            if (configSettings['fix-bugs']) {
                try {
                    // Example API call using axios
                    const response = await axios.post('https://api.example.com/fix-bugs', { apiKey });
                    vscode.window.showInformationMessage('Fixed bugs successfully.');
                } catch (error) {
                    vscode.window.showErrorMessage('Error fixing bugs: ' + error.message);
                }
            }

            // Add similar blocks for optimize-code and generate-tests based on configSettings

        } else {
            vscode.window.showInformationMessage('Not a valid trigger.');
        }
    });

    // Push subscriptions to the context
    context.subscriptions.push(disposable, editorInputDisposable);
}

module.exports = {
    activate
};
