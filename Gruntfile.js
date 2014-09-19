/*global module:false*/
module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= pkg.author %> <%= grunt.template.today("yyyy") %>;' +
			' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',

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
				src: ['<%= config.dist %>']
			},
			temp: {
				src: ['<%= config.temp %>']
			}
		},

	    copy: {
	    	deploy: {
	    		files: [
	    			{ expand: true, src: ['<%= config.dist %>/*'], dest: '<%= config.server %>'},	    			
	    			{ expand:true, src: ['./index.html'], dest: '<%= config.server %>'}
	    		]
	    	}
	    },

	    // Task configuration.
	    concat: {
	      options: {
	        banner: '<%= banner %>',
	        stripBanners: true
	      },
	      dist: {
	        src: ['<%= config.temp %>/<%= pkg.name %>.html.js', '<%= config.js %>'],
	        dest: '<%= config.dist %>/<%= pkg.name %>.js'
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
	        tasks: ['copy:deploy']
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

	grunt.registerTask('build', 
		'Compiles all of the assets and copies the files to the build directory & deply them into java server.', 
		['clean', 'jshint', 'less', 'html2js', 'concat', 'clean:temp', 'copy:deploy']
	);

	//grunt.registerTask('default', 'Watches the project for changes, automatically builds them and runs a server.', [ 'build', 'connect', 'watch' ]);
	grunt.registerTask('default', ['build', 'watch']);

};