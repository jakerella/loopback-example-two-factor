/*jshint node:true, indent:4, maxlen:140*/
var speakeasy = require('speakeasy');

module.exports = function(Employee) {
    
    // By overriding the default `login()` method here we can 
    // restrict the UI from "accidentally" trying to hit the /api/Employees/login route
    Employee.login = function(credentials, include, fn) {
        fn(new Error('This application requires two-factor authentication.'));
    };
    
    /**
     * Request a two-factor authentication code for use during the login process
     * NOTE: this does NOT send the code anywhere, that is left as an experiment 
     *       for the reader of this example code. :)
     * 
     * @param  {object}   credentials A JSON object containing "email" and "password" fields
     * @param  {Function} fn          The function to call in the Loopback for sending back data
     * @return {void}
     */
    Employee.requestCode = function(credentials, fn) {
        var self = this,
            now = (new Date()).getTime(),
            defaultError = new Error('login failed');
        
        defaultError.statusCode = 401;
        defaultError.code = 'LOGIN_FAILED';
        
        if (!credentials.email || !credentials.password) {
            return fn(defaultError);
        }
        
        self.findOne({where: { email: credentials.email }}, function(err, user) {
            if (err) {
                return fn(defaultError);
            } else if (user) {
                user.hasPassword(credentials.password, function(err, isMatch) {
                    if (err) {
                        return fn(defaultError);
                    } else if (isMatch) {
                        
                        var code = speakeasy.totp({key: 'APP_SECRET' + credentials.email});
                        
                        console.log('Two factor code for ' + credentials.email + ': ' + code);
                        
                        // [TODO] hook into your favorite SMS API and 
                        //        send your user the code!
                        
                        fn(null, now);
                        
                    } else {
                        return fn(defaultError);
                    }
                });
            } else {
                return fn(defaultError);
            }
        });
    };
    
    /**
     * A method for logging in a user using a time-based (quickly expiring)
     * verification code obtained using the `requestCode()` method.
     * 
     * @param  {object}   credentials A JSON object containing "email" and "twofactor" fields
     * @param  {Function} fn          The function to call in the Loopback for sending back data
     * @return {void}
     */
    Employee.loginWithCode = function(credentials, fn) {
        var self = this,
            defaultError = new Error('login failed');
        
        defaultError.statusCode = 401;
        defaultError.code = 'LOGIN_FAILED';
        
        if (!credentials.email || !credentials.twofactor) {
            return fn(defaultError);
        }
        
        self.findOne({ where: { email: credentials.email } }, function(err, user) {
            if (err) return fn(err);
            if (!user) return fn(defaultError);
            
            var code = speakeasy.totp({key: 'APP_SECRET' + credentials.email});

            if (code !== credentials.twofactor) {
                return fn(defaultError);
            }
            
            user.createAccessToken(86400, function(err, token) {
                if (err) return fn(err);
                token.__data.user = user;
                fn(err, token);
            });
        });
    };
    
    
    Employee.remoteMethod(
        'requestCode',
        {
            description: 'Request a two-factor code for a user with email and password',
            accepts: [
                {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}}
            ],
            returns: {arg: 'timestamp', type: 'string'},
            http: {verb: 'post'}
        }
    );

    Employee.remoteMethod(
        'loginWithCode',
        {
            description: 'Login a user with email and two-factor code',
            accepts: [
                {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}}
            ],
            returns: {
                arg: 'accessToken',
                type: 'object',
                root: true,
                description: 'The response body contains properties of the AccessToken created on login.\n'
            },
            http: {verb: 'post'}
        }
    );
    
};
