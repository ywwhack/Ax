(function(global){
    var Ax = global.Ax = global.Ax?global.Ax:{};

    /*
    * Template Engine
    * */
    var TE = Ax.TE = {};

    TE.compile = function(templateStr){
        var re = /(?:<%([^%>]+)%>)|(?:{{([^}]+)}})/g,
            match = null,
            buf = [],
            start = 0,
            end = 0,
            result = '';

        //buf.push(htmlPart)->buf.push(jsPart) for every loop
        while(match = re.exec(templateStr)){
            end = match.index;
            buf.push("result+='"+templateStr.slice(start, end)+"';\r\n");
            start = match.index+match[0].length;
            if(match[2]!==undefined){
                buf.push("result+="+match[2].trim()+";\r\n");
            }else{
                buf.push(match[1].trim()+"\r\n");
            }
        }
        buf.push("result+='"+templateStr.slice(start)+"';\r\n"); //last part

        function render(locals){
            //translate variable to locals.varible
            if(locals){
                var props = '',
                    propRe = null,
                    str;
                for(var i in locals){
                    props += i+'|';
                }
                props = props.slice(0, -1);
                propRe = new RegExp(props, 'g');
                str = buf.join("").replace(propRe, function(){
                    return 'locals.'+arguments[0];
                });
            }
            eval(str || buf.join("")); //execute the str
            return result;
        }

        return {
            render:render
        }
    };

    /*
    * getView
    * */
    var href = location.href,
        root,
        path;
    if(!location.hash){
        href = href + '#/';
        location.href = href;
    }
    path = href.split('#')[0];
    root = path.slice(0, path.lastIndexOf('/')+1);

    Ax.getView = function(url){
        var xhr = new XMLHttpRequest();
        return new Promise(function(resolve, reject){
            xhr.open('GET', root+url);
            xhr.onload = function(){
                if(xhr.status == '200'){
                    resolve(xhr.responseText);
                }else{
                    reject(xhr.status);
                }
            };
            xhr.send();
        });
    };

    /*
    * define app
    * */
    var config = {},
        bootstrap = false;
    Ax.module = function(){
        function when(url, conf){
            config[url] = {
                templateUrl:conf.templateUrl,
                controller:conf.controller,
                locals:conf.locals
            };

            return this;
        }

        bootstrap = true;
        return {
            when:when
        }
    };

    /*
    * execute
    * */
    window.onload = function(){
        var container = document.querySelector('[data-view]'),
            timer = setInterval(function(){
                if(bootstrap){
                    window.onhashchange = view;
                    view();
                    clearInterval(timer);
                }
            }, 30);

        function view(){
            var hash = location.hash.slice(1),
                route = config[hash];
            Ax.getView(route.templateUrl).then(function(template){
                var html = Ax.TE.compile(template).render(route.locals);
                container.innerHTML = html;
                route.controller && route.controller();
            });
        }
    };
})(window);
