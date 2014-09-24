/*global module:false*/
module.exports = function(grunt) {

	grunt.registerMultiTask("gitTag", "Creates a tag in the provided repository folder", function () {
        var done = this.async();
        var repoFolder = this.filesSrc[0];

        var options = this.options({
            //remote: 'origin',
            tagMessage: this.options().tagName/*,
            force: this.options().force,*/
        });

        grunt.util.async.series([
            function (callback) {
                grunt.log.writeln('GIT: Creating local tag \'%s\' into: \'%s\'', options.tagName, repoFolder);
                grunt.util.spawn({ cmd: 'git', args: [ 'tag', '-a', options.tagName, '-m', options.tagMessage ], opts: { cwd: repoFolder } }, callback);
            },            
            function (callback) {
                grunt.log.writeln('GIT: Add changes from:  \'%s\'', repoFolder);
                //add all changed files
                grunt.util.spawn({ cmd: 'git', args: [ 'add', '.'], opts: { cwd: repoFolder } }, callback);
            },
            function (callback) {
                grunt.log.writeln('GIT: Commit into: \'%s\'', repoFolder);
                grunt.util.spawn({ cmd: 'git', args: [ 'commit', '-m', options.commitMessage ], opts: { cwd: repoFolder } }, callback);
            } /*,
            function (callback) {
                grunt.log.writeln('Pushing tag \'%s\' to \'%s\' remote', options.tag, options.remote);
                var args = [ 'push', options.remote, '--tags' ];

                if (options.force) {
                    args.push('--force');
                }
                grunt.util.spawn({ cmd: 'git', args: args, opts: { cwd: repoFolder } }, callback);
            },*/
        ], done);
    });

	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),



		config: {
			temp: './temp',
			dist: './dist',
			src: './src',
			server: './java-server/src/main/webapp',
			js: [
				'<%= config.src %>/**/*.js', //source files
				'!<%= config.src %>/**/*.spec.js' //unit testing
			],
			tpl: '<%= config.src %>/**/*.tpl.html'
		},

		clean: {
			dist: {
				src: ['<%= config.dist %>/*.js','<%= config.dist %>/*.css', '<%= config.dist %>/*.html']
			},
			temp: {
				src: ['<%= config.temp %>']
			},
			deploy: {
				src: ['<%= config.server %>/dist', '<%= config.server %>/bower_components']
			}
		},

	    copy: {
	    	deploy: {
	    		files: [
	    			{ expand: true, src: ['<%= config.dist %>/*', './index.html', './bower_components/**/*' ], dest: '<%= config.server %>'} ]
	    	},
	    	deploy_index: {
	    		files: [ { expand:true, src: ['./index.html'], dest: '<%= config.server %>'} ]
	    	},	    	
	    	licenses: {
				files: [
	    			{ expand:true, src: ['./LICENSE-MIT'], dest: '<%= config.dist %>'}
	    		]
	    	}
	    },

	    // Task configuration.
	    concat: {
			options: {
		        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
						'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
						'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
						'* Copyright (c) <%= pkg.author %> <%= grunt.template.today("yyyy") %>;' +
						' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
	        	stripBanners: true
		    },
	    	js: {
		        src: ['<%= config.temp %>/<%= pkg.name %>.html.js', '<%= config.js %>'],
		        dest: '<%= config.dist %>/<%= pkg.name %>.js'
	    	},
	    	css: {
		        src: ['<%= config.dist %>/<%= pkg.name %>.css'],
		        dest: '<%= config.dist %>/<%= pkg.name %>.css'
	    	}
    	},

    	less: {
    		development: {
			    options: {
			      paths: ["<%= config.src %>"]
			    },
			    files: {
			      "<%= config.dist %>/<%= pkg.name %>.css": "<%= config.src %>/<%= pkg.name %>.less"
			    }
			  }
    	},

    	watch: {
	      gruntfile: {
	        files: '<%= jshint.gruntfile.src %>',
	        tasks: ['build']
	      },
	      js: {
	        files: ['<%= config.js %>', '<%= config.tpl %>', '<%= config.src %>/*.less'],
	        tasks: ['build']
	      },
	      index: {
	        files: './index.html',
	        tasks: ['copy:deploy_index']
	      }
	    },

    	html2js: {
    		options: {
		      	module: 'angular.crud.grid', // no bundle module for all the html2js templates
		      	singleModule: true
		      	//module:false,
		      	/*rename: function() {
		      		return 'angular.crud.grid';
		      	}*/
		    },
		    main: {
		    	src: ['<%= config.tpl %>'],
		    	dest: '<%= config.temp %>/<%= pkg.name %>.html.js'
		    }
		},

		bump: {
		    options: {
				files: ['package.json', './dist/bower.json'],
				updateConfigs: ['pkg'],
				commit: true,
				commitMessage: 'Release v%VERSION%',
				commitFiles: ['-a'],
				createTag: false,
				//tagName: 'v%VERSION%',
				//tagMessage: 'Version %VERSION%',
				push: false,
				//pushTo: 'upstream',
				//gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
		    }
	  	},

	  	gitTag: {
	  		release: {
	  			options: {
	  				tagName: '<%= pkg.version %>',
	  				tagMessage: 'Version <%= pkg.version %>',
	  				commitMessage: 'Release <%= pkg.version %>'
	  			},
	  			src: './dist'
	  		}
	  	},

	    jshint: {
	      options: {
	        curly: true,
	        eqeqeq: true,
	        immed: true,
	        latedef: true,
	        newcap: true,
	        noarg: true,
	        sub: true,
	        undef: true,
	        unused: true,
	        boss: true,
	        eqnull: true,
	        browser: true,
	        globals: {
	          angular: true
	        }
	      },
	      gruntfile: {
	        src: 'Gruntfile.js'
	      }
	    }

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-html2js');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-bower');
	grunt.loadNpmTasks('grunt-bump');
	//grunt.loadNpmTasks('grunt-git');
	// grunt.loadNpmTasks('grunt-execute');


	grunt.registerTask('build',
		'Compiles all of the assets and copies the files to the build directory & deply them into java server.',
		[  'jshint', 'less', 'html2js', 'concat', 'copy:licenses', 'clean:temp', 'clean:deploy', 'copy:deploy']
	);

	grunt.registerTask('release-patch',
		'Build and generate new release patch version',
		[ 'bump-only:patch', 'build', 'bump-commit', 'gitTag:release' ]
	);

	grunt.registerTask('release-minor',
		'Build and generate new release minor version',
		[ 'bump-only:minor', 'build', 'bump-commit' ]
	);

	grunt.registerTask('release-major',
		'Build and generate new release minor version',
		[ 'bump-only:major', 'build', 'bump-commit' ]
	);
	
	grunt.registerTask('default', ['build', 'watch']);

	grunt.registerTask('abc', ['gitTag:release']);

};