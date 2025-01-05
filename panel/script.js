document.addEventListener('DOMContentLoaded', function () {
    const topicList = document.getElementById("topic-list");
    const peopleList = document.getElementById("people-list");
    const introText = document.getElementById("intro-text");
    const chatBox = document.createElement("div");
    chatBox.id = "chat-box";
    chatBox.style.display = "none";
    introText.parentNode.parentNode.insertBefore(chatBox, introText.parentNode.nextSibling);


    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.id = "chat-input-field";
    inputField.placeholder = "Type your response here...";
    const sendButton = document.createElement("button");
    sendButton.id = "chat-send-button";
    sendButton.textContent = "Send";



    inputField.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleUserResponse(inputField.value);
        }
    });

    let currentPerson = null;
    let currentTopic = null;
    let conversationHistory = [];
    let userProfile = {};

    function populatePeopleList(topic) {
        peopleList.innerHTML = "";
        currentTopic = topic;
        const people = topics_and_people[topic];
        for (const person in people) {
            const li = document.createElement("li");
            li.textContent = person;
            li.addEventListener("click", () => showPersonIntro(person, topic, li));
            peopleList.appendChild(li);
        }

        introText.innerHTML = `<p>Please select a person from the <b>${topic}</b> list.</p>`;
        chatBox.style.display = "none";
        conversationHistory = [];
        clearChatBox();
    }
function showPersonIntro(person, topic, clickedElement) {
    peopleList.querySelectorAll("li").forEach(item => item.classList.remove("selected"));
    clickedElement.classList.add("selected");

    currentPerson = person;
    introText.innerHTML = `<p>Connecting to ${person}...</p>`;
        // Update introText with the person's name and a connecting message
    introText.innerHTML = `<p>Connecting to ${person}..</p>`;
    generateAIResponse({ name: person, topic: topic }).then(response => {
        // Clear the connecting message *before* setting the new content
        introText.innerHTML = ""; // Clear existing content


        // Create a container for the AI response text. This prevents the text from being replaced when we append the image and link
        const responseContainer = document.createElement('div');
        responseContainer.innerHTML = response;
        introText.appendChild(responseContainer);


        let nameForURL = currentPerson.replace(/\s+/g, '_');
        let baseUrl = "https://en.wikipedia.org/wiki/";
        let newUrl = baseUrl + nameForURL;

        const personImage = document.createElement("img");
        personImage.src = topics_and_people[topic][person];
        personImage.alt = person;
        personImage.style.maxWidth = "100px";
        personImage.style.maxHeight = "100px";

        const wikiLink = document.createElement("p");
        const linkText = document.createTextNode(`Learn more about ${currentPerson} on Wikipedia`);
        const wikiLinkA = document.createElement("a");
        wikiLinkA.href = newUrl;
        wikiLinkA.target = "_blank";
        wikiLinkA.appendChild(linkText);
        wikiLink.appendChild(wikiLinkA);

        // Append image and link *after* setting the AI response content
        introText.appendChild(personImage);
        introText.appendChild(wikiLink);

        askToLearnMore();
    });
}

    function askToLearnMore() {
        const followUp = document.createElement("p");
        followUp.textContent = `Hi, I'm ${currentPerson}. What would you like to know about me?`;
        chatBox.innerHTML = "";
        chatBox.appendChild(followUp);
        chatBox.style.display = "block";

        chatBox.appendChild(inputField);
        chatBox.appendChild(sendButton);

        sendButton.onclick = () => {
            handleUserResponse(inputField.value);
        };

        // Automatically focus on the input field for better user experience
        inputField.focus();
    }

    function startChatAutomatically() {
        const firstTopic = Object.keys(topics_and_people)[0];
        const firstPerson = Object.keys(topics_and_people[firstTopic])[0];

        populatePeopleList(firstTopic);

        const firstPersonElement = peopleList.querySelector("li:first-child");
        if (firstPersonElement) {
            firstPersonElement.click();
        }
    }


    function handleUserResponse(response) {
        const chatContent = document.createElement("p");
        chatContent.textContent = `You: ${response}`;
        chatContent.style.color = "blue"; // Set your messages to blue
        chatBox.insertBefore(chatContent, inputField);

        inputField.value = "";

        conversationHistory.push({ role: "user", content: response });

        generateFollowUpResponse(response);
    }

    function generateFollowUpResponse(question) {
        const loadingMessage = document.createElement("p");
        loadingMessage.textContent = "Thinking...";
        chatBox.insertBefore(loadingMessage, inputField);

        let prompt = `You are ${currentPerson}, a prominent figure in ${currentTopic}. Engage in a conversation with the user.`;
        prompt += conversationHistory.map(message => {
            return `${message.role === "user" ? "User" : "You"}: ${message.content}`;
        }).join(" ");

        const action = chooseAction();
        if (action === "personalQuestion") {
            prompt += ` Ask the user a simple personal question to get to know them better.`;
        } else if (action === "advice") {
            prompt += ` Offer a piece of advice relevant to the conversation, as if you were ${currentPerson}.`;
        } else {
            prompt += ` Continue the conversation.`;
        }

        generateAIResponse({ prompt: prompt }, true).then(response => {
            chatBox.removeChild(loadingMessage);
            const aiResponse = document.createElement("p");

            let responseText = response;
            if (action === "personalQuestion") {
                const extractedQuestion = extractPersonalQuestion(response);
                if (extractedQuestion) {
                    responseText = extractedQuestion;
                }
            } else if (action === "advice") {
                const extractedAdvice = extractAdvice(response);
                if (extractedAdvice) {
                    responseText = extractedAdvice;
                }
            }

            aiResponse.textContent = `${responseText}`;
            conversationHistory.push({ role: "mentor", content: responseText });
            chatBox.insertBefore(aiResponse, inputField);

            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }

    function chooseAction() {
        const randomValue = Math.random();
        if (randomValue < 0.1) {
            return "personalQuestion";
        } else if (randomValue < 0.2) {
            return "advice";
        } else {
            return "continueConversation";
        }
    }

    function extractPersonalQuestion(response) {
        if (response.includes("?") && response.split(" ").length < 15) {
            return response;
        }
        return null;
    }

    function extractAdvice(response) {
        return response;
    }

     function generateAIResponse(persona, isFollowUp = false) {
        let prompt;
        if (!isFollowUp) {
            if (!persona.name && persona.topic) {
                return Promise.resolve("<p>Please select a person from the list.</p>");
            } else if (!persona.name || !persona.topic) {
                return Promise.resolve("<p>Please select a topic and a person.</p>");
            }

            // ***MODIFIED PROMPT***
            prompt = `You are ${persona.name}, a prominent figure in ${persona.topic}. Respond in a 3 paragraphs about yourself including the below information


    Name: ${persona.name}
    Roles: Briefly list your key roles or titles.


    List three significant accomplishments in your career. Be concise.


    Briefly describe any philanthropic activities or social impact initiatives you've been involved in.


    Value: State one core value that drives you.
    Motivation: State one key motivation that inspires you.
    Include two quotes not by ${persona.name} that you find particularly meaningful.

Keep your entire response under 100 words.`; // Increased word limit slightly

        } else {
            prompt = persona.prompt;
        }

        console.log("Sending prompt:", prompt);


        return new Promise((resolve, reject) => {
            const ws = new WebSocket(
                `wss://backend.buildpicoapps.com/ask_ai_streaming?app_id=second-several&prompt=${encodeURIComponent(
                    prompt
                )}`
            );
            let fullResponse = "";

            ws.onmessage = (event) => {
                fullResponse += event.data;
            };

            ws.onclose = () => {
                resolve(fullResponse);
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                reject(error);
            };
        });
    }

    loadUserProfile();

    function saveUserProfile() {
        localStorage.setItem("userProfile", JSON.stringify(userProfile));
    }

    function loadUserProfile() {
        const storedProfile = localStorage.getItem("userProfile");
        if (storedProfile) {
            userProfile = JSON.parse(storedProfile);
        }
    }

    function clearChatBox() {
        while (chatBox.firstChild) {
            chatBox.removeChild(chatBox.firstChild);
        }
        chatBox.appendChild(inputField);
        chatBox.appendChild(sendButton);
    }

    for (const topic in topics_and_people) {
        const li = document.createElement("li");
        li.textContent = topic;
        li.addEventListener("click", () => populatePeopleList(topic));
        topicList.appendChild(li);
    }

    introText.innerHTML = "<p>Please select a topic and a person.</p>";
    startChatAutomatically();
});