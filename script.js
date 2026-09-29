const SUPABASE_URL = "https://nxclyhvlzjvhwqviwgkw.supabase.co";
const SUPABASE_KEY = "sb_publishable_sZ9rFYFY4euL6IrSLwI-Ow_JDD2Gv5f";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const textInput = document.getElementById("textInput");
const saveBtn = document.getElementById("saveBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const savedText = document.getElementById("savedText");
const status = document.getElementById("status");
const messageCount = document.getElementById("messageCount");

async function loadMessages() {
    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Load error:", error);
        status.textContent = "Error loading messages.";
        return;
    }

    displayMessages(data);
}

function displayMessages(messages) {
    savedText.innerHTML = "";

    const count = messages ? messages.length : 0;

    if (count === 0) {
        messageCount.textContent = "";
        savedText.innerHTML = `
            <div class="empty-message">
                No text saved yet.
            </div>
        `;
        return;
    }

    messageCount.textContent = `${count} saved`;

    messages.forEach(function (message) {
        const messageBox = document.createElement("div");
        messageBox.className = "message-box";

        const messageContent = document.createElement("div");
        messageContent.className = "message-content";
        messageContent.textContent = message.content;

        const actions = document.createElement("div");
        actions.className = "message-actions";

        const copyButton = document.createElement("button");
        copyButton.textContent = "Copy";
        copyButton.className = "copy-message";

        copyButton.addEventListener("click", async function () {
            try {
                await navigator.clipboard.writeText(message.content);
                status.textContent = "Copied!";
            } catch (error) {
                console.error("Copy error:", error);
                status.textContent = "Copy failed.";
            }
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-message";

        deleteButton.addEventListener("click", async function () {
            const { error } = await supabaseClient
                .from("messages")
                .delete()
                .eq("id", message.id);

            if (error) {
                console.error("Delete error:", error);
                status.textContent = "Error deleting message.";
                return;
            }

            status.textContent = "Message deleted.";
            loadMessages();
        });

        actions.appendChild(copyButton);
        actions.appendChild(deleteButton);

        messageBox.appendChild(messageContent);
        messageBox.appendChild(actions);

        savedText.appendChild(messageBox);
    });
}

saveBtn.addEventListener("click", async function () {
    const text = textInput.value.trim();

    if (text === "") {
        status.textContent = "Please enter some text.";
        return;
    }

    const { error } = await supabaseClient
        .from("messages")
        .insert([
            {
                content: text
            }
        ]);

    if (error) {
        console.error("Save error:", error);
        status.textContent = "Error saving message.";
        return;
    }

    textInput.value = "";
    status.textContent = "Text saved!";
    loadMessages();
});

copyBtn.addEventListener("click", async function () {
    const { data, error } = await supabaseClient
        .from("messages")
        .select("content")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Copy all error:", error);
        status.textContent = "Error copying messages.";
        return;
    }

    if (!data || data.length === 0) {
        status.textContent = "There is no text to copy.";
        return;
    }

    const allText = data
        .map(message => message.content)
        .join("\n\n");

    try {
        await navigator.clipboard.writeText(allText);
        status.textContent = "All messages copied!";
    } catch (error) {
        console.error("Copy error:", error);
        status.textContent = "Copy failed.";
    }
});

clearBtn.addEventListener("click", function () {
    textInput.value = "";
    status.textContent = "Input cleared.";
});

loadMessages();
