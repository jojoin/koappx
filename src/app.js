/*
* app
*/
const Koa = require('koa');
const app = new Koa();

const util = require('./util')

// modules
const config = require('./config').config()
const paths = require('./boot').paths()
const ctxres = require('./ctxres')
const language = require('./language')
const viewer = require('./viewer')
const router = require('./router')
const static = require('./static')



/*
* run
*/
async function start(){
    await ctxres.load(app)
    await language.load(paths, config, app)
    await viewer.load(paths, config, app)
    await router.load(paths, config, app)
    await static.server(paths, config, app)
} 
start().then()


/*
* listen
*/
app.listen(config.http_port, function(){
    console.log(`app listening on port ${config.http_port}!`)
});

// exit event
process.on('exit', function(){

})


// app
exports.app = function() {
    return app
}

