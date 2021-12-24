/**
 * util fs
 */
const fs = require('fs')




/**
 * 
 */
 exports.reads = function(nameAry, opts, callback)
 {
     opts = opts || {};
 
     var leg = nameAry.length
         ,fileCon = []  //读取的单文件内容数组
         ,hasNum = 0; //已经读取的文件数量统计
     if(!leg){
         return callback(opts.merge?'':[]);
     }
     fileCon.length = leg; //保证与item的顺序相同
     for(var i=0;i<leg;i++){
         read(i);
     }
     //读取文件
     function read(k){
         var file = nameAry[k];
         if(opts.path){ // 基路径
             file = path.join(opts.path, file);
         }
         if(opts.ext){ // 文件后缀
             file = file+'.'+opts.ext;
         }
         fs.readFile(file, 'utf8',function(err, data){
             if( !opts.ignore&&err ) return callback(err);
             hasNum++;
             fileCon[k] = data;
             if(hasNum==leg){ //已经读完
                 callback(null, opts.merge ? fileCon.join(opts.join||'') : fileCon);
                 /*if(true==opts.merge){
                     var content = '';
                     for(var j=0;j<leg;j++){ //合并文件
                         content += fileCon[j]
                     }
                     callback(err,content);
                 }else{
                     //console.log(fileCon);
                     callback(err,fileCon); //返回数组
                 }*/
             }
         });
     }
 };


 // 同步版本
 exports.readsSync = function(fileAry, opts)
 {
     opts = opts || {};
     var cons = [];
     // 依次读取文件
     for(var f in fileAry){
         var file = fileAry[f];
         if(opts.path){ // 基路径
             file = path.join(opts.path, file);
         }
         if(opts.ext){ // 文件后缀
             file = file+'.'+opts.ext;
         }
         let one = ''
         try {
             one = fs.readFileSync(file, 'utf8')
         } catch (error) {
             if(!opts.ignore){
                 throw error
             }
         }
         cons.push( one );
     }
     return opts.merge ? cons.join('') : cons;
 }
 
 
 
 
 /**
  * 扫描文件夹下的文件和目录
  * rec 是否递归获取文件
  */
 exports.scanSync = function(path, rec){
     var fileList = [],
         folderList = [];
 
     walk(path, fileList, folderList);
 
     function walk(path, fileList, folderList){
         files = fs.readdirSync(path);
         files.forEach(function(item) {  
             var tmpPath = path + '/' + item,
                 stats = fs.statSync(tmpPath);
 
             if (stats.isDirectory()) {  
                 if(rec)
                     walk(tmpPath, fileList, folderList); 
                 folderList.push(tmpPath); 
             } else {  
                 fileList.push(tmpPath); 
             }  
         });  
     };  
     // console.log('扫描' + path +'成功');
     return {
         'files': fileList,
         'folders': folderList
     }
 }