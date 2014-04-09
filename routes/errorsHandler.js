exports.pageNotFound = function(request, response, next)
{
    response.status(404);
    response.description = 'Not found';
    response.render('404');
}

//var sendEmail = function(message) {};

exports.errorHandler = function(err, request, response, next)
{
    //sendEmail(err.stack);

    response.status(500);
    response.render('error', {description: 'I now it has gone wrong', stack: err.stack});
}