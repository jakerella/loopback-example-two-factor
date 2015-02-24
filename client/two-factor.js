/*jshint browser:true, indent:4, maxlen:140*/
(function() {
    var token = null,
        loggedin = document.getElementById('loggedin'),
        loginForm = document.getElementById('login'),
        userDisplay = document.getElementById('user');
    
    function checkForTwoFactorAuth(form) {
        var email = form.querySelector('[name=email]'),
            password = form.querySelector('[name=password]'),
            code = form.querySelector('[name=code]'),
            button = form.querySelector('[type=submit]');
        
        if (code.value) {
            
            loginWithCode({ email: email.value, code: code.value }, function(err, data) {
                if (err) { return window.alert(err); }
                
                form.style.display = 'none';
                loggedin.style.display = 'block';
                userDisplay.innerHTML = JSON.stringify(data);
                token = data;
            });
            
        } else {
            
            sendTwoFactorAuth({ email: email.value, password: password.value }, function(err) {
                if (err) { return window.alert(err); }
                
                var verifyCode = window.prompt('Check your mobile phone for a one-time use code!');
                if (code) {
                    code.value = verifyCode;
                    button.value = 'Login Now!';
                    password.value = '';
                }
            });
        }
    }
    
    function sendTwoFactorAuth(credentials, callback) {
        var xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/api/Employees/requestCode', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            
            if (xhr.status !== 200) {
                return callback('Login failed, please try again.');
            }
            
            callback(null);
        };
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            email: credentials.email,
            password: credentials.password
        }));
    }
    
    function loginWithCode(credentials, callback) {
        var xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/api/Employees/loginWithCode', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            
            if (xhr.status !== 200) {
                return callback('Sorry, your two-factor login failed!');
            }
            
            callback(null, JSON.parse(xhr.responseText));
        };
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            email: credentials.email,
            twofactor: credentials.code
        }));
    }
    
    function logout(callback) {
        if (!token || !token.id) {
            return callback(null);
        }
        
        var xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/api/Employees/logout', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            
            if (xhr.status !== 200) {
                return callback('Logout failed, please try again.');
            }
            
            callback(null);
        };
        xhr.setRequestHeader('Authorization', token.id);
        xhr.send();
    }
    
    loginForm
        .addEventListener('submit', function(e) {
            e.preventDefault();
            checkForTwoFactorAuth(e.target);
            return false;
        });
    
    document
        .getElementById('logout')
        .addEventListener('click', function(e) {
            e.preventDefault();
            logout(function(err) {
                if (err) { return window.alert(err); }
                
                loginForm.style.display = 'block';
                loggedin.style.display = 'none';
                loginForm.querySelector('[name=code]').value = '';
                token = null;
            });
        });
})();