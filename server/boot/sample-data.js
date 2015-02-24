module.exports = function(app) {
  var Employee = app.models.Employee;

  Employee.create([
    {email: 'john@doe.com', password: 'opensesame'},
    {email: 'jane@doe.com', password: 'foobar'}
  ], function(err, employees) {
    if (err) throw err;
    console.log('Created employees:', employees);
  });
};
