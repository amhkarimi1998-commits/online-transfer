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
// STORAGE SETTINGS
// =========================
const STORAGE_BUCKET = "files";
const STORAGE_PROJECT_ID =
    "nxclyhvlzjvhwqviwgkw";
const TUS_ENDPOINT =
    `https://${STORAGE_PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;
const RESUMABLE_THRESHOLD =
    6 * 1024 * 1024;
const TUS_CHUNK_SIZE =
    6 * 1024 * 1024;
let activeUploadCancel = null;
let uploadCancelled = false;
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
// FILE SELECT
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
// CREATE UNIQUE FILE PATH
// =========================
function createFilePath(
    userId,
    file
) {

    const extension =
        file.name.includes(".")
            ? file.name.substring(
                file.name.lastIndexOf(".")
            )
            : "";

    const uniqueName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}${extension}`;

    return `${userId}/${uniqueName}`;
}
// =========================
// STANDARD UPLOAD
// =========================
async function standardUpload(
    filePath,
    file,
    accessToken
) {
    return new Promise(
        function (resolve, reject) {
            const encodedFilePath =
                filePath
                    .split("/")
                    .map(
                        encodeURIComponent
                    )
                    .join("/");
            const uploadUrl =
                `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${encodedFilePath}`;
            const xhr =
                new XMLHttpRequest();

            activeUploadCancel =
                function () {
                    uploadCancelled = true;
                    xhr.abort();
                };

            xhr.open(
                "POST",
                uploadUrl,
                true
            );
            xhr.setRequestHeader(
                "Authorization",
                `Bearer ${accessToken}`
            );
            xhr.setRequestHeader(
                "apikey",
                SUPABASE_KEY
            );
            xhr.setRequestHeader(
                "x-upsert",
                "false"
            );
            xhr.setRequestHeader(
                "Content-Type",
                file.type ||
                "application/octet-stream"
            );
            xhr.upload.addEventListener(
                "progress",
                function (event) {
                    if (!event.lengthComputable) {
                        return;
                    }
                    const percentage =
                        (
                            event.loaded /
                            event.total *
                            100
                        ).toFixed(1);
                    const uploadedMB =
                        (
                            event.loaded /
                            1024 /
                            1024
                        ).toFixed(2);
                    const totalMB =
                        (
                            event.total /
                            1024 /
                            1024
                        ).toFixed(2);
                    uploadBtn.textContent =
                        `Cancel Upload (${percentage}%)`;
                    status.textContent =
                        `${uploadedMB} MB / ${totalMB} MB`;
                }
            );
            xhr.addEventListener(
                "load",
                function () {
                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {
                        resolve();
                    } else {
                        reject(
                            new Error(
                                `Upload failed: ${xhr.status} ${xhr.responseText}`
                            )
                        );
                    }
                }
            );
            xhr.addEventListener(
                "error",
                function () {
                    reject(
                        new Error(
                            "Network error during upload."
                        )
                    );
                }
            );
            xhr.addEventListener(
                "abort",
                function () {
                    if (uploadCancelled) {
                        reject(
                            new Error(
                                "UPLOAD_CANCELLED"
                            )
                        );
                        return;
                    }

                    reject(
                        new Error(
                            "Upload was aborted."
                        )
                    );
                }
            );
            xhr.send(file);
        }
    );
}
// =========================
// RESUMABLE TUS UPLOAD
// =========================
async function resumableUpload(
    filePath,
    file,
    accessToken
) {
    return new Promise(
        function (resolve, reject) {
            const upload =
                new tus.Upload(
                    file,
                    {
                        endpoint:
                            TUS_ENDPOINT,
                        retryDelays: [
                            0,
                            3000,
                            5000,
                            10000,
                            20000
                        ],
                        headers: {
                            authorization:
                                `Bearer ${accessToken}`,
                            "x-upsert":
                                "false"
                        },
                        uploadDataDuringCreation:
                            true,
                        removeFingerprintOnSuccess:
                            true,
                        metadata: {
                            bucketName:
                                STORAGE_BUCKET,
                            objectName:
                                filePath,
                            contentType:
                                file.type ||
                                "application/octet-stream",
                            cacheControl:
                                "3600"
                        },
                        chunkSize:
                            TUS_CHUNK_SIZE,
                        onError:
                            function (error) {
                                console.error(
                                    "TUS upload error:",
                                    error
                                );

                                if (uploadCancelled) {
                                    reject(
                                        new Error(
                                            "UPLOAD_CANCELLED"
                                        )
                                    );
                                    return;
                                }

                                reject(error);
                            },
                        onProgress:
                            function (
                                bytesUploaded,
                                bytesTotal
                            ) {
                                const percentage =
                                    (
                                        bytesUploaded /
                                        bytesTotal *
                                        100
                                    ).toFixed(1);
                                const uploadedMB =
                                    (
                                        bytesUploaded /
                                        1024 /
                                        1024
                                    ).toFixed(2);
                                const totalMB =
                                    (
                                        bytesTotal /
                                        1024 /
                                        1024
                                    ).toFixed(2);
                                uploadBtn.textContent =
                                    `Cancel Upload (${percentage}%)`;
                                status.textContent =
                                    `${uploadedMB} MB / ${totalMB} MB`;
                            },
                        onSuccess:
                            function () {
                                resolve();
                            }
                    }
                );

            activeUploadCancel =
                function () {
                    uploadCancelled = true;

                    upload.abort(true)
                        .catch(
                            function (error) {
                                console.error(
                                    "TUS abort error:",
                                    error
                                );
                            }
                        );

                    reject(
                        new Error(
                            "UPLOAD_CANCELLED"
                        )
                    );
                };

            upload.findPreviousUploads()
                .then(
                    function (previousUploads) {
                        if (
                            uploadCancelled
                        ) {
                            return;
                        }

                        if (
                            previousUploads &&
                            previousUploads.length > 0
                        ) {
                            upload.resumeFromPreviousUpload(
                                previousUploads[0]
                            );
                        }

                        upload.start();
                    }
                )
                .catch(
                    function (error) {
                        console.error(
                            "TUS start error:",
                            error
                        );
                        reject(error);
                    }
                );
        }
    );
}
// =========================
// SAVE FILE INFORMATION
// =========================
async function saveFileInformation(
    file,
    filePath
) {
    const {
        error
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
    if (error) {
        throw error;
    }
}
// =========================
// REMOVE STORAGE FILE
// =========================
async function removeStorageFile(
    filePath
) {
    const {
        error
    } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .remove([
                filePath
            ]);
    if (error) {
        console.error(
            "Storage cleanup error:",
            error
        );
    }
}
// =========================
// UPLOAD FILE
// =========================
uploadBtn.addEventListener(
    "click",
    async function () {

        if (activeUploadCancel) {
            activeUploadCancel();
            return;
        }

        const file =
            fileInput.files[0];
        if (!file) {
            status.textContent =
                "Please choose a file first.";
            return;
        }

        uploadCancelled = false;
        uploadBtn.disabled = false;
        uploadBtn.textContent =
            "Preparing...";
        uploadBtn.style.setProperty(
            "background",
            "#dc3545",
            "important"
        );
        
        uploadBtn.style.setProperty(
            "color",
            "#ffffff",
            "important"
        );
        status.textContent = "";
        let filePath = null;

        try {
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
            const {
                data: {
                    session
                }
            } =
                await supabaseClient.auth.getSession();
            if (!session) {
                status.textContent =
                    "Your session has expired.";
                return;
            }
            filePath =
                createFilePath(
                    user.id,
                    file
                );
            const useResumableUpload =
                file.size >
                RESUMABLE_THRESHOLD;
            if (useResumableUpload) {
                status.textContent =
                    "Starting resumable upload...";
                uploadBtn.textContent =
                    "Cancel Upload (0%)";
                await resumableUpload(
                    filePath,
                    file,
                    session.access_token
                );
            } else {
                status.textContent =
                    "Uploading...";
                uploadBtn.textContent =
                    "Cancel Upload (0%)";
                await standardUpload(
                    filePath,
                    file,
                    session.access_token
                );
            }

            activeUploadCancel = null;

            uploadBtn.textContent =
                "Saving information...";
            await saveFileInformation(
                file,
                filePath
            );
            fileInput.value = "";
            selectedFile.textContent =
                "";
            status.textContent =
                "File uploaded successfully!";
            loadFiles();

        } catch (error) {
            console.error(
                "Upload error:",
                error
            );

            if (
                error &&
                error.message ===
                "UPLOAD_CANCELLED"
            ) {
                status.textContent =
                    "Upload cancelled.";
            } else {
                if (filePath) {
                    await removeStorageFile(
                        filePath
                    );
                }

                status.textContent =
                    "Error uploading file.";
            }

            if (
                error &&
                error.message ===
                "UPLOAD_CANCELLED" &&
                filePath
            ) {
                await removeStorageFile(
                    filePath
                );
            }

        } finally {
            activeUploadCancel = null;
            uploadCancelled = false;

            uploadBtn.style.removeProperty("background");
            uploadBtn.style.removeProperty("color");
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
            // =========================
            // DOWNLOAD
            // =========================
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
                                .from(STORAGE_BUCKET)
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
            // =========================
            // DELETE
            // =========================
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
                                .from(STORAGE_BUCKET)
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
