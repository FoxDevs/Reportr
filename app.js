var express = require('express'),
    path    = require('path');

var config        = require('./myLibs/config');
var errorsHandler = require('./routes/errorsHandler');
var homePage      = require('./routes/homePage');

var projectsRouter= require('./routes/projectsRouter');
var tasksRouter   = require('./routes/tasksRouter');
var userRouter    = require('./routes/userRouter');

var passport =  require('./myLibs/passportSettings').passport;

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.favicon());        // отдаем стандартную фавиконку, можем здесь же свою задать
app.use(express.logger('dev'));    // выводим все запросы со статусами в консоль
//app.use(express.body);    // выводим все запросы со статусами в консоль
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.bodyParser( { keepExtensions: true, uploadDir: path.join(__dirname, '/pictures' )} ));
app.use(express.methodOverride()); // поддержка put и delete
app.use(express.static(path.join(__dirname, "public"))); // Запуск статического файлового сервера, который смотрит на папку public/ (в нашем случае отдает index.html)
app.use(app.router);                 // модуль для простого задания обработчиков путей
app.use(errorsHandler.pageNotFound);
app.use(errorsHandler.errorHandler);

//app.get('/', homePage.index);
app.get('/', ensureAuthenticated, projectsRouter.list);

app.get('/users/create', userRouter.create);
app.post('/users/create', userRouter.createUser);

app.get('/login', userRouter.login);
app.post('/login',
    passport.authenticate('local', { successRedirect: '/projects/list',
                                     failureRedirect: '/unsuccessful' })
);
app.get('/successful', userRouter.successful);
app.get('/unsuccessful', userRouter.unsuccessful);
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/successful',
                                        failureRedirect: '/unsuccessful' }));

app.get ('/projects',             ensureAuthenticated, projectsRouter.list);
app.get ('/projects/',            ensureAuthenticated, projectsRouter.list);
app.get ('/projects/list',        ensureAuthenticated, projectsRouter.list);
app.get ('/projects/create',      ensureAuthenticated, projectsRouter.create);
app.post('/projects/create',     ensureAuthenticated, projectsRouter.createProject);
app.get ('/projects/details/:id', ensureAuthenticated, projectsRouter.details);
app.get ('/projects/delete/:id',  ensureAuthenticated, projectsRouter.delete);

app.get ('/tasks',            ensureAuthenticated, tasksRouter.list);
app.get ('/tasks/',           ensureAuthenticated, tasksRouter.list);
app.get ('/tasks/list/:id',   ensureAuthenticated, tasksRouter.list);
app.get ('/tasks/create/:id', ensureAuthenticated, tasksRouter.create);
app.post('/tasks/create',    ensureAuthenticated, tasksRouter.createTask);
app.get ('/tasks/delete/:id', ensureAuthenticated, tasksRouter.delete);
app.get ('/tasks/edit/:id',   ensureAuthenticated, tasksRouter.edit);
app.post('/tasks/edit',      ensureAuthenticated, tasksRouter.editTask);
app.get ('/tasks/calendar/:id',        ensureAuthenticated, tasksRouter.calendar);
app.get ('/tasks/calendar/events/:id', ensureAuthenticated, tasksRouter.returnEvents);


app.listen(config.get('port'), function(){
    console.log('Express server listening on port ' + config.get('port'));
});

function ensureAuthenticated(req, res, next)
{
    console.log(req.isAuthenticated());

    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/login');
    }
}

