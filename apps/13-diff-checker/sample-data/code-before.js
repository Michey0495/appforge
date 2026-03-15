// ユーザー認証処理（リファクタリング前）
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'app_user',
  password: 'password123',
  database: 'user_db'
});

function authenticateUser(username, password, callback) {
  if (username && password) {
    connection.query('SELECT * FROM users WHERE username = "' + username + '"', function(err, results) {
      if (err) {
        console.log('DB error');
        callback(null);
      } else {
        if (results.length > 0) {
          var user = results[0];
          if (user.password === password) {
            if (user.is_active === 1) {
              connection.query('UPDATE users SET last_login = NOW() WHERE id = ' + user.id, function(err2) {
                if (err2) {
                  console.log('Update error');
                  callback(null);
                } else {
                  var token = Math.random().toString(36).substring(2);
                  callback({ token: token, user: user });
                }
              });
            } else {
              console.log('User is not active');
              callback(null);
            }
          } else {
            console.log('Wrong password');
            callback(null);
          }
        } else {
          console.log('User not found');
          callback(null);
        }
      }
    });
  } else {
    callback(null);
  }
}

module.exports = authenticateUser;
