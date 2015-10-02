module.exports = function (grunt) {
    
    // load the task
    grunt.loadNpmTasks("grunt-typescript");
    
    // Configure grunt here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
				' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n\n'
        },
        typescript: {
            dist: {
                src: ["typescript-json-schema.ts"],
                dest: 'dist/typescript-json-schema.js',
                options: {
                    module: "commonjs",
                    target: "es5",
                    references: [
                        "typings/typescript/typescript.d.ts"
                    ]
                }
            }
        }
    });
    
    grunt.registerTask("default", ["exec:compile"]);
}