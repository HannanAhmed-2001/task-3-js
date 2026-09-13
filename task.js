// Project ki baqi Admin/User files ki tarah simple var variables use kiye gaye hain.
var userForm = document.getElementById("userForm")
var username = document.getElementById("username")
var email = document.getElementById("email")
var password = document.getElementById("password")
var userList = document.getElementById("userList")
var userCount = document.getElementById("userCount")
var statusText = document.getElementById("status")
var submitBtn = document.getElementById("submitBtn")
var cancelBtn = document.getElementById("cancelBtn")
var formTitle = document.getElementById("formTitle")
var editKey = ""

// Message show karne ke liye helper function.
function showMessage(message, type) {
    statusText.innerText = message
    statusText.className = type || ""
}

// Firebase se users read karke table mein show karta hai.
async function getAllUsers() {
    userList.innerHTML = `
        <tr>
            <td class="loading" colspan="4">Loading users...</td>
        </tr>
    `

    await firebase.database().ref("user").get()
        .then((db) => {
            console.log(db.val())

            userList.innerHTML = ""

            if (db.val() == null) {
                userList.innerHTML = `
                    <tr>
                        <td class="empty" colspan="4">No user found</td>
                    </tr>
                `
                userCount.innerText = "0 users"
                return
            }

            // Firebase object ko array mein convert karna.
            var data = Object.values(db.val())
            var keys = Object.keys(db.val())

            userCount.innerText = data.length +
                (data.length == 1 ? " user" : " users")

            for (var i = 0; i < data.length; i++) {
                var userKey = data[i].userkey || data[i].userKey || keys[i]
                var userPassword = data[i].password || ""

                userList.innerHTML += `
                    <tr>
                        <td class="user-name">
                            ${data[i].username || data[i].name || "No name"}
                        </td>
                        <td>${data[i].email || "No email"}</td>
                        <td class="password-cell">
                            ${"•".repeat(Math.max(6, userPassword.length))}
                        </td>
                        <td>
                            <div class="actions">
                                <button
                                    class="small-btn edit-btn"
                                    onclick="editUser('${userKey}')">
                                    Edit
                                </button>
                                <button
                                    class="small-btn delete-btn"
                                    onclick="deleteUser('${userKey}')">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `
            }
        })
        .catch((e) => {
            console.log(e)

            userList.innerHTML = `
                <tr>
                    <td class="empty" colspan="4">
                        Firebase se data read nahi ho saka
                    </td>
                </tr>
            `

            showMessage("Firebase error: " + e.message, "error")
        })
}

// New user ko Firebase mein add karta hai.
async function addNewUser() {
    var key = await firebase.database().ref("user").push().key

    console.log(key)

    var object = {
        userkey: key,
        username: username.value,
        email: email.value,
        password: password.value,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    }

    console.log(object)

    await firebase.database().ref("user").child(key).set(object)

    alert("User add successfully")

    getAllUsers()
    resetForm()
}

// Form submit par add ya update function chalata hai.
userForm.addEventListener("submit", async function (event) {
    event.preventDefault()

    if (editKey == "") {
        try {
            await addNewUser()
        }
        catch (e) {
            console.log(e)
            showMessage("User save nahi ho saka: " + e.message, "error")
        }
    }
    else {
        await updateUser()
    }
})

// Firebase ke selected record ko form mein load karta hai.
async function editUser(key) {
    await firebase.database().ref("user").child(key).get()
        .then((db) => {
            var data = db.val()

            if (data == null) {
                return
            }

            editKey = key
            username.value = data.username || data.name || ""
            email.value = data.email || ""
            password.value = data.password || ""
            password.required = false
            submitBtn.innerText = "Update user"
            cancelBtn.style.display = "inline-block"
            formTitle.innerText = "Edit user"

            showMessage("User edit mode mein hai")
            username.focus()
        })
        .catch((e) => {
            console.log(e)
            showMessage("User read nahi ho saka: " + e.message, "error")
        })
}

// Selected user ki values Firebase mein update karta hai.
async function updateUser() {
    var object = {
        username: username.value,
        email: email.value
    }

    // Password blank ho to purana password preserve hota hai.
    if (password.value != "") {
        object.password = password.value
    }

    await firebase.database().ref("user").child(editKey).update(object)
        .then(() => {
            alert("User update successfully")

            getAllUsers()
            resetForm()
        })
        .catch((e) => {
            console.log(e)
            showMessage("User update nahi ho saka: " + e.message, "error")
        })
}

// Firebase se selected user permanently delete karta hai.
async function deleteUser(key) {
    var confirmDelete = confirm(
        "Kya aap is user ko delete karna chahte hain?"
    )

    if (confirmDelete == false) {
        return
    }

    await firebase.database().ref("user").child(key).remove()
        .then(() => {
            alert("User delete successfully")
            getAllUsers()
        })
        .catch((e) => {
            console.log(e)
            showMessage("User delete nahi ho saka: " + e.message, "error")
        })
}

// Form ko dobara Add mode mein lata hai.
function resetForm() {
    userForm.reset()
    editKey = ""
    password.required = true
    submitBtn.innerText = "Add user"
    cancelBtn.style.display = "none"
    formTitle.innerText = "Add new user"
}

cancelBtn.addEventListener("click", function () {
    resetForm()
    showMessage("Edit cancel kar diya gaya")
})

// Page open hote hi Firebase se users load karta hai.
getAllUsers()
