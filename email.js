const apiKey = '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';

let defaultPrompt = "Tell me to record the kind of email I want you to write. Don't use the word sure.";

let TextValues = {
    emptyPrompt: defaultPrompt,
    userPrompt: defaultPrompt,
    display: { 
        default: "Write an e-mail to", 
        errors: {
            speechNotCaptured: "No speech captured. Try again.",
            languageAlreadyAdded: "Language has already been added under the name",
            badLanguage: "Invalid language or place. Please try again.",
            failedToAddLanguage: "Failed to add language. Please try again.\nError: ",
    
        }
    },
    recordBtn: {
        default: "Record", 
        inProgress: "Recording...", 
        restart: "Try again"
    },
    generateBtn: "Generate",
    recipientAddressField: "Recipient address",
    subjectField: "Subject",
    messageField: "Message body",
    
}

let languages = [
    ['en-US', 'English (US)'], 
    ['es', 'Español'],

];

let recording = false;
let selectedLangIndex = 0;

recordBtn.onclick = record;
generateBtn.onclick = generate;
sendBtn.onclick = sendMail;
addLanguageBtn.onclick = toggleInputBox;
select.onchange = translatePage;
navForm.onsubmit = (e)=>{
    e.preventDefault()
    addLanguage()
}

updateLanguageSelect();

function sendMail(){
    let rec = recipientBox.value;
    let subject = subjectBox.value;
    let msg = messageBox.value;
    let URL = encodeURI(`mailto:${rec}?subject=${subject}&body=${msg}`);
    location.assign(URL);
}
function addLanguage(){
    let inp = navForm.children[0]
    if (inp) {
        new_lang = inp.value.charAt(0).toUpperCase() + inp.value.slice(1)
        output = sendToChatGPT(`What is the language code for ${new_lang}`)
        output.then((result)=>{
            let val = result.match(/".*"/)
            if (val){
                code = val[0].split('"')[1].replace(/\s/g, '')
                // Ensure list doesn't already have an option for this language
                let optionExists = false;
                let existing = [];
                for (langset of languages){
                    if (code == langset[0] || langset[0].includes(code)){
                        optionExists = true
                        existing = langset
                    }
                }
                if (!optionExists) {
                    languages.push([code, new_lang])
                    updateLanguageSelect();
                    inp.classList.remove("slide-in")
                    inp.value = ""
                    if (display.style.color == 'red'){
                        display.style.color = ''
                        display.textContent = TextValues.display.default
                    }
                } else {
                    showError(`${TextValues.display.errors.languageAlreadyAdded} ${existing[1]}`)
                }
            } else {
                showError(TextValues.display.errors.badLanguage)
            }
        })
        output.catch(err=>{
            showError(TextValues.display.errors.failedToAddLanguage + err.message)
        })
    }
}
function toggleInputBox(){
    let inp = navForm.children[0]
    if (!inp.classList.contains("slide-in")) {
        inp.classList.add("slide-in")
        inp.focus()
        
    } else {
        inp.classList.remove("slide-in")
        
        inp.value ? addLanguage() : pass;
        inp.value = "";
    }
    
}

//Create select element with all supported languages as options
function updateLanguageSelect() {
    let currIndex = select.selectedIndex != -1? select.selectedIndex : 0;
    
    for (let i = select.children.length-1; i >= 0 ; --i){
        if (select.children[0]){
            select.removeChild(select.children[0]);
        }
    }
    for (const lang_set of languages) {
        opt = document.createElement('option');
        opt.value = lang_set[0];
        opt.textContent = lang_set[1];
        select.appendChild(opt);
    }
    select.selectedIndex = currIndex;
}

function record() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        if (!recording) {
            recordBtn.textContent = TextValues.recordBtn.inProgress;
            recordBtn.classList.replace("btn-outline-primary", "btn-outline-danger");

            recording = true;
        
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = select.value;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                let prefix = TextValues.display.default; 
                TextValues.userPrompt = event.results[event.resultIndex][0].transcript;
                if (!TextValues.userPrompt.includes(prefix)) {
                    TextValues.userPrompt = prefix + " " + TextValues.userPrompt[0].toLowerCase() + TextValues.userPrompt.slice(1);
                }
                display.style.color = ""
                display.textContent = TextValues.userPrompt;
                recordBtn.textContent = TextValues.recordBtn.restart;
                recordBtn.classList.replace("btn-outline-danger", "btn-outline-primary");

                recording = false;
            };

            recognition.onerror = (event) => {
                if (event.error == "no-speech") {
                    recordBtn.textContent = TextValues.recordBtn.default;
                    recordBtn.classList.replace("btn-outline-danger", "btn-outline-primary");
                    showError(TextValues.display.errors.speechNotCaptured);
                    TextValues.userPrompt = TextValues.emptyPrompt;
                    recording = false; 
                } else {
                    console.error('Speech recognition error:', event.error);
                }
            };

            recognition.start();
        }
        
    } else {
        console.log('Speech recognition not supported in this browser.');
    }
}

function generate() {
    const chatOutput = sendToChatGPT(TextValues.userPrompt);
    chatOutput.then(
        (response)=>{
            if (TextValues.userPrompt != TextValues.emptyPrompt){
                messageBox.style.color = "";
                const lines = response.split("\n");
                let subjPlaceholder = TextValues.subjectField + ": ";
                let subject = lines[0].replace(subjPlaceholder, "");
                let body = lines.slice(2).join("\n");
                subjectBox.value = subject;
                messageBox.value = body;
            } else {
                showError(response)
            }
        }
    )
    
}

async function sendToChatGPT(userInput) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",  // or use the latest model version (e.g., "gpt-4")
            messages: [{ role: "user", content: userInput }],
            max_tokens: 500,
        }),
    });

    const data = await response.json();
    const chatOutput = data.choices[0].message.content;
    return chatOutput;
    
}

function translatePage() {
    selectedLangIndex = select.selectedIndex;
    let prompt = `translate the values of this JSON object to ${languages[selectedLangIndex][1]}: ${JSON.stringify(TextValues)}`;
    const response = sendToChatGPT(prompt);
    response.then((data)=>{
        // Update text values to translated version
        oldDisplayPrompts = [TextValues.display.default];
        TextValues = JSON.parse(data);

        // If user has existing prompt, translate it.
        if (!oldDisplayPrompts.includes(display.value)) {
            translateElementText(display);
        } else {
            display.style.color = ""
            display.textContent = TextValues.display.default;
        }

        // Update currently displayed text in elements to translated version
        if (languages[selectedLangIndex][1] == "English"){
            // Reset to reduce translation errors
            TextValues= {
                emptyPrompt: defaultPrompt,
                userPrompt: defaultPrompt,
                display: { 
                    default: "Write an e-mail to", 
                    error: "No speech captured. Try again."
                },
                recordBtn: {
                    default: "Record", 
                    inProgress: "Recording...", 
                    restart: "Try again"
                },
                generateBtn: "Generate",
                recipientAddressField: "Recipient address",
                subjectField: "Subject",
                messageField: "Message body"
            }
        }
        recordBtn.textContent = TextValues.recordBtn.default;
        
        generateBtn.textContent = TextValues.generateBtn;
        recipientBox.placeholder = TextValues.recipientAddressField;
        subjectBox.placeholder = TextValues.subjectField;
        messageBox.placeholder = TextValues.messageField;
        
        [subjectBox, messageBox].forEach((element)=>{
            if (element.value) {
                translateElementText(element, true);
            }
        })

    });
    function translateElementText(element, usesValue=false) {
        text = usesValue? element.value : text = element.textContent;
        selectedLangIndex = select.selectedIndex;
        let prompt = `translate this text to ${languages[selectedLangIndex][1]}: "${text}"`;
        const response = sendToChatGPT(prompt);
        response.then((translation)=>{
            // Remove quotation marks from response
            if (['"',"'"].includes(translation[0]) && ['"',"'"].includes(translation.slice(-1))){
                translation = translation.slice(1,-1);
            }
            usesValue ? element.value = translation: element.textContent = translation;
        });
    }
}

function showError(text) {
    display.style.color = "red"
    display.textContent = text;
}