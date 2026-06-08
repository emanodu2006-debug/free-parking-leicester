const button = document.getElementById("button");
var username = document.getElementById("username");
var password = document.getElementById("password");

button.addEventListener("click", () => {
    const usernameValue = username.value;
    const passwordValue = password.value;
    username.value = "";
    password.value = "";

    if (usernameValue.length < 5 || passwordValue.length < 5){
        alert("Username and Password must be at least 5 characters long.");
    }

    if (usernameValue === "admin" && passwordValue === "admin"){
        document.body.insertAdjacentHTML("beforeend", "<h1>Welcome, admin!</h1>");
        } else {
        alert("Invalid username or password.");
    }



})