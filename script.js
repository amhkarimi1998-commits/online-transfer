const SUPABASE_URL = "https://nxclyhvlzjvhwqviwgkw.supabase.co";
const SUPABASE_KEY = "sb_publishable_sZ9rFYFY4euL6IrSLwI-Ow_JDD2Gv5f";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================
// AUTH ELEMENTS
// =========================

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginStatus = document.getElementById("loginStatus");
const logoutBtn = document.getElementById("logoutBtn");


// =========================
// APP ELEMENTS
// =========================

const textInput = document.getElementById("textInput");
const saveBtn = document.getElementById("saveBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const savedText = document.getElementById("savedText");
const status = document.getElementById("status");
const messageCount = document.getElementById("messageCount");

const fileInput = document.getElementById("fileInput");
const selectedFile = document.getElementById("selectedFile");
const uploadBtn = document.getElementById("uploadBtn");
const savedFiles = document.getElementById("savedFiles");
const fileCount = document.getElementById("fileCount");


// =========================
// AUTH FUNCTIONS
// =========================

function showLoginScreen() {
    loginScreen.style.display = "flex";
    appScreen.style.display = "none";
}


function showAppScreen() {
    loginScreen.style.display = "none";
    appScreen.style.display = "block";
}


// =========================
// LOGIN
// =========================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        if (email === "" || password === "") {

            loginStatus.textContent =
                "Please enter your email and password.";

            return;
        }


        loginBtn.disabled = true;

        loginBtn.textContent =
            "Signing in...";

        loginStatus.textContent = "";


        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            loginStatus.textContent =
                "Invalid email or password.";

            loginBtn.disabled = false;

            loginBtn.textContent =
                "Sign In";

            return;
        }


        loginStatus.textContent = "";

        passwordInput.value = "";

        loginBtn.disabled = false;

        loginBtn.textContent =
            "Sign In";
    }
);


// =========================
// LOGOUT
// =========================

logoutBtn.addEventListener(
    "click",
    async function () {

        logoutBtn.disabled = true;

        logoutBtn.textContent =
            "Signing out...";


        const { error } =
            await supabaseClient.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

            status.textContent =
                "Error signing out.";

            logoutBtn.disabled =
                false;

            logoutBtn.textContent =
                "Sign Out";

            return;
        }


        logoutBtn.disabled =
            false;

        logoutBtn.textContent =
            "Sign Out";
    }
);


// =========================
// AUTH STATE
// =========================

supabaseClient.auth.onAuthStateChange(
    function (event, session) {

        if (session && session.user) {

            showAppScreen();

            loadMessages();
            loadFiles();

        } else {

            showLoginScreen();

        }
    }
);


// =========================
// CHECK AUTHENTICATION
// =========================

async function checkAuthentication() {

    const { data, error } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Authentication check error:",
            error
        );

        showLoginScreen();

        return;
    }


    if (data.session && data.session.user) {

        showAppScreen();

        loadMessages();
        loadFiles();

    } else {

        showLoginScreen();

    }
}


// =========================
// TEXT FUNCTIONS
// =========================

async function loadMessages() {

    const { data, error } =
        await supabaseClient
            .from("messages")
            .select("*")
            .order("created_at", {
                ascending: true
            });


    if (error) {

        console.error(
            "Load error:",
            error
        );

        status.textContent =
            "Error loading messages.";

        return;
    }


    displayMessages(data);
}


function displayMessages(messages) {

    savedText.innerHTML = "";

    const count =
        messages ? messages.length : 0;


    if (count === 0) {

        messageCount.textContent = "";

        savedText.innerHTML = `
            <div class="empty-message">
                No text saved yet.
            </div>
        `;

        return;
    }


    messageCount.textContent =
        `${count} saved`;


    messages.forEach(
        function (message) {

            const messageBox =
                document.createElement("div");

            messageBox.className =
                "message-box";


            const messageContent =
                document.createElement("div");

            messageContent.className =
                "message-content";

            messageContent.textContent =
                message.content;


            const actions =
                document.createElement("div");

            actions.className =
                "message-actions";


            const copyButton =
                document.createElement("button");

            copyButton.textContent =
                "Copy";

            copyButton.className =
                "copy-message";


            copyButton.addEventListener(
                "click",
                async function () {

                    try {

                        await navigator.clipboard.writeText(
                            message.content
                        );

                        copyButton.textContent =
                            "✓ Copied";

                        status.textContent =
                            "Copied!";


                        setTimeout(
                            function () {

                                copyButton.textContent =
                                    "Copy";

                            },
                            1500
                        );

                    } catch (error) {

                        console.error(
                            "Copy error:",
                            error
                        );

                        status.textContent =
                            "Copy failed.";
                    }
                }
            );


            const deleteButton =
                document.createElement("button");

            deleteButton.textContent =
                "Delete";

            deleteButton.className =
                "delete-message";


            deleteButton.addEventListener(
                "click",
                async function () {

                    const confirmed =
                        confirm(
                            "Are you sure you want to delete this message?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    deleteButton.textContent =
                        "Deleting...";

                    deleteButton.disabled =
                        true;


                    const { error } =
                        await supabaseClient
                            .from("messages")
                            .delete()
                            .eq(
                                "id",
                                message.id
                            );


                    if (error) {

                        console.error(
                            "Delete error:",
                            error
                        );

                        status.textContent =
                            "Error deleting message.";

                        deleteButton.textContent =
                            "Delete";

                        deleteButton.disabled =
                            false;

                        return;
                    }


                    status.textContent =
                        "Message deleted.";

                    loadMessages();
                }
            );


            actions.appendChild(copyButton);
            actions.appendChild(deleteButton);

            messageBox.appendChild(
                messageContent
            );

            messageBox.appendChild(
                actions
            );

            savedText.appendChild(
                messageBox
            );
        }
    );
}


// =========================
// SAVE TEXT
// =========================

saveBtn.addEventListener(
    "click",
    async function () {

        const text =
            textInput.value.trim();


        if (text === "") {

            status.textContent =
                "Please enter some text.";

            return;
        }


        saveBtn.disabled = true;

        saveBtn.textContent =
            "Saving...";

        status.textContent = "";


        const { error } =
            await supabaseClient
                .from("messages")
                .insert([
                    {
                        content: text
                    }
                ]);


        if (error) {

            console.error(
                "Save error:",
                error
            );

            status.textContent =
                "Error saving message.";

            saveBtn.disabled =
                false;

            saveBtn.textContent =
                "Save";

            return;
        }


        textInput.value = "";

        status.textContent =
            "Text saved!";

        saveBtn.disabled =
            false;

        saveBtn.textContent =
            "Save";

        loadMessages();
    }
);


// =========================
// COPY ALL
// =========================

copyBtn.addEventListener(
    "click",
    async function () {

        const { data, error } =
            await supabaseClient
                .from("messages")
                .select("content")
                .order("created_at", {
                    ascending: true
                });


        if (error) {

            console.error(
                "Copy all error:",
                error
            );

            status.textContent =
                "Error copying messages.";

            return;
        }


        if (!data || data.length === 0) {

            status.textContent =
                "There is no text to copy.";

            return;
        }


        const allText =
            data
                .map(
                    message =>
                        message.content
                )
                .join("\n\n");


        try {

            await navigator.clipboard.writeText(
                allText
            );

            copyBtn.textContent =
                "✓ Copied All";

            status.textContent =
                "All messages copied!";


            setTimeout(
                function () {

                    copyBtn.textContent =
                        "Copy All";

                },
                1500
            );

        } catch (error) {

            console.error(
                "Copy error:",
                error
            );

            status.textContent =
                "Copy failed.";
        }
    }
);


// =========================
// CLEAR
// =========================

clearBtn.addEventListener(
    "click",
    function () {

        textInput.value = "";

        status.textContent =
            "Input cleared.";
    }
);


// =========================
// FILE FUNCTIONS
// =========================

fileInput.addEventListener(
    "change",
    function () {

        const file =
            fileInput.files[0];


        if (!file) {

            selectedFile.textContent =
                "";

            return;
        }


        const sizeMB =
            file.size /
            (1024 * 1024);


        selectedFile.textContent =
            `${file.name} • ${sizeMB.toFixed(2)} MB`;
    }
);


// =========================
// UPLOAD FILE
// =========================

uploadBtn.addEventListener(
    "click",
    async function () {

        const file =
            fileInput.files[0];


        if (!file) {

            status.textContent =
                "Please choose a file first.";

            return;
        }


        uploadBtn.disabled = true;

        uploadBtn.textContent =
            "Uploading...";

        status.textContent = "";


        try {

            const uniqueName =
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 10)}-${file.name}`;


            const {
                data: {
                    user
                }
            } =
                await supabaseClient.auth.getUser();


            if (!user) {

                status.textContent =
                    "You are not logged in.";

                return;
            }


            const filePath =
                `${user.id}/${uniqueName}`;


            const {
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from("files")
                    .upload(
                        filePath,
                        file,
                        {
                            cacheControl: "3600",
                            upsert: false,
                            contentType:
                                file.type ||
                                "application/octet-stream"
                        }
                    );


            if (uploadError) {

                console.error(
                    "Upload error:",
                    uploadError
                );

                status.textContent =
                    "Error uploading file.";

                return;
            }


            const {
                error: databaseError
            } =
                await supabaseClient
                    .from("files")
                    .insert([
                        {
                            name: file.name,
                            path: filePath,
                            size: file.size,
                            type:
                                file.type ||
                                "application/octet-stream"
                        }
                    ]);


            if (databaseError) {

                console.error(
                    "Database error:",
                    databaseError
                );


                await supabaseClient
                    .storage
                    .from("files")
                    .remove([
                        filePath
                    ]);


                status.textContent =
                    "Error saving file information.";

                return;
            }


            fileInput.value = "";

            selectedFile.textContent =
                "";

            status.textContent =
                "File uploaded successfully!";

            loadFiles();

        } catch (error) {

            console.error(
                "Unexpected upload error:",
                error
            );

            status.textContent =
                "Error uploading file.";

        } finally {

            uploadBtn.disabled =
                false;

            uploadBtn.textContent =
                "Upload File";
        }
    }
);


// =========================
// LOAD FILES
// =========================

async function loadFiles() {

    const { data, error } =
        await supabaseClient
            .from("files")
            .select("*")
            .order("created_at", {
                ascending: true
            });


    if (error) {

        console.error(
            "Load files error:",
            error
        );

        fileCount.textContent =
            "";

        savedFiles.innerHTML = `
            <div class="empty-files">
                Error loading files.
            </div>
        `;

        return;
    }


    displayFiles(data);
}


// =========================
// DISPLAY FILES
// =========================

function displayFiles(files) {

    savedFiles.innerHTML = "";

    const count =
        files ? files.length : 0;


    if (count === 0) {

        fileCount.textContent =
            "";

        savedFiles.innerHTML = `
            <div class="empty-files">
                No files uploaded yet.
            </div>
        `;

        return;
    }


    fileCount.textContent =
        `${count} saved`;


    files.forEach(
        function (file) {

            const fileBox =
                document.createElement("div");

            fileBox.className =
                "file-box";


            const fileInfo =
                document.createElement("div");

            fileInfo.className =
                "file-info";


            const fileName =
                document.createElement("div");

            fileName.className =
                "file-name";

            fileName.textContent =
                file.name;


            const fileSize =
                formatFileSize(
                    file.size
                );

            const fileType =
                file.type ||
                "Unknown type";


            const fileDetails =
                document.createElement("div");

            fileDetails.className =
                "file-details";

            fileDetails.textContent =
                `${fileSize} • ${fileType}`;


            fileInfo.appendChild(
                fileName
            );

            fileInfo.appendChild(
                fileDetails
            );


            const actions =
                document.createElement("div");

            actions.className =
                "file-actions";


            const downloadButton =
                document.createElement("button");

            downloadButton.textContent =
                "Download";

            downloadButton.className =
                "download-file";


            downloadButton.addEventListener(
                "click",
                async function () {

                    downloadButton.disabled =
                        true;

                    downloadButton.textContent =
                        "Preparing...";


                    try {

                        const {
                            data,
                            error
                        } =
                            await supabaseClient
                                .storage
                                .from("files")
                                .download(
                                    file.path
                                );


                        if (error) {

                            console.error(
                                "Download error:",
                                error
                            );

                            status.textContent =
                                "Error downloading file.";

                            return;
                        }


                        const url =
                            URL.createObjectURL(
                                data
                            );


                        const link =
                            document.createElement(
                                "a"
                            );

                        link.href =
                            url;

                        link.download =
                            file.name;


                        document.body.appendChild(
                            link
                        );

                        link.click();

                        link.remove();


                        URL.revokeObjectURL(
                            url
                        );


                        status.textContent =
                            "Download started.";

                    } catch (error) {

                        console.error(
                            "Download error:",
                            error
                        );

                        status.textContent =
                            "Error downloading file.";

                    } finally {

                        downloadButton.disabled =
                            false;

                        downloadButton.textContent =
                            "Download";
                    }
                }
            );


            const deleteButton =
                document.createElement("button");

            deleteButton.textContent =
                "Delete";

            deleteButton.className =
                "delete-file";


            deleteButton.addEventListener(
                "click",
                async function () {

                    const confirmed =
                        confirm(
                            `Are you sure you want to delete "${file.name}"?`
                        );


                    if (!confirmed) {
                        return;
                    }


                    deleteButton.disabled =
                        true;

                    deleteButton.textContent =
                        "Deleting...";


                    try {

                        const {
                            error: storageError
                        } =
                            await supabaseClient
                                .storage
                                .from("files")
                                .remove([
                                    file.path
                                ]);


                        if (storageError) {

                            console.error(
                                "Storage delete error:",
                                storageError
                            );

                            status.textContent =
                                "Error deleting file.";

                            return;
                        }


                        const {
                            error: databaseError
                        } =
                            await supabaseClient
                                .from("files")
                                .delete()
                                .eq(
                                    "id",
                                    file.id
                                );


                        if (databaseError) {

                            console.error(
                                "Database delete error:",
                                databaseError
                            );

                            status.textContent =
                                "File removed from storage, but database cleanup failed.";

                            return;
                        }


                        status.textContent =
                            "File deleted.";

                        loadFiles();

                    } catch (error) {

                        console.error(
                            "Delete error:",
                            error
                        );

                        status.textContent =
                            "Error deleting file.";

                    } finally {

                        deleteButton.disabled =
                            false;

                        deleteButton.textContent =
                            "Delete";
                    }
                }
            );


            actions.appendChild(
                downloadButton
            );

            actions.appendChild(
                deleteButton
            );


            fileBox.appendChild(
                fileInfo
            );

            fileBox.appendChild(
                actions
            );

            savedFiles.appendChild(
                fileBox
            );
        }
    );
}


// =========================
// FORMAT FILE SIZE
// =========================

function formatFileSize(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );
}


// =========================
// START
// =========================

checkAuthentication();
