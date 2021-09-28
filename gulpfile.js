// ------------------------------ config ------------------------------

const gulp = require('gulp');
const csso = require('gulp-csso');
const rename = require('gulp-rename');
const sassCompiler = require('gulp-sass')(require('sass'));
const merge = require('merge-stream');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const tsify = require('tsify');
const autoprefixer = require('gulp-autoprefixer');
const fs = require('fs');
const stringify = require('stringify');
const uglifyify = require('uglifyify');
const minifyStream = require('minify-stream');

const src = {
    assets: './src/'
};

src.templates = src.assets + 'ts/views/*';
src.ts = src.assets + 'ts';
src.sass = src.assets + 'sass';

const dest = {

    assets: './dist/'
};

dest.js = dest.assets + 'scripts';
dest.css = dest.assets + 'styles';

// --------------------------------------------------------------------

// ---------------------------- arguments -----------------------------

// verifica se foi passado o parâmetro "--upload"
const uploadFiles = process.argv.indexOf('--upload') !== -1;

// verifica se foi passado o parâmetro "--prod" na chamada da task
const production = process.argv.indexOf('--prod') !== -1;

process.env.NODE_ENV = production ? 'production' : 'development';

// --------------------------------------------------------------------

// ---------------------------- functions -----------------------------

// compila os arquivos referentes ao nome do app
function compileFiles(appName) {

    let stream;

    const cssOnly = process.argv.indexOf('--css-only') !== -1;
    const jsOnly = process.argv.indexOf('--js-only') !== -1;

    let styles;
    let scripts;

    if (cssOnly) {

        styles = css();

        stream = styles;
    }

    if (jsOnly) {

        scripts = js();

        stream = scripts;
    }

    if (!cssOnly && !jsOnly) {

        styles = css();
        scripts = js();

        stream = merge(styles, scripts);
    }

    return stream;

    // realiza processos para gerar os arquivos js
    function js() {

        let streamJs = gulp.src('.');

        const tsPath = `${src.ts}/inits/${appName}.init.ts`;

        if (fs.existsSync(tsPath)) {

            // 1 - pegue o arquivo "init" typescript do app
            // 2 - compile o arquivo para javascript
            // 3 - aplique pollyfills caso seja necessário 
            let scripts = browserify(tsPath)
                .plugin(tsify, { typeRoots: ["./node_modules/@types", "./type-definitions"], target: "esnext" })
                .transform(stringify, {
                    appliesTo: { includeExtensions: ['.html'] },
                    minify: true,
                    minifyOptions: {
                        collapseBooleanAttributes: true,
                        collapseInlineTagWhitespace: true,
                        collapseWhitespace: true,
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        sortAttributes: true,
                        sortClassName: true,
                        trimCustomFragments: true
                    }
                })
                .transform(babelify, {
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                'useBuiltIns': 'usage',
                                'corejs': 3
                            }
                        ]
                    ],
                    extensions: ['.ts']
                })
                .transform('exposify', { expose: { angular: 'angular' }, filePattern: /\.ts/ })
                .external(['angular']);

            // se solicitado a minificação...
            if (production) {

                // aplique os seguintes plugins:
                // 1 - Aplique as configurações de produção
                // 2 - Minifique cada módulo (arquivo .ts) individualmente
                // 3 - Remove exports não utilizados
                // 4 - Simplifica os 'require' do js final para variáveis
                scripts = scripts.transform('envify', { global: true })
                    .transform(uglifyify, { global: true })
                    .plugin('common-shakeify')
                    .plugin('browser-pack-flat/plugin');
            }

            // junte os arquivos e coloque o arquivo final na pasta de destino
            scripts = scripts.bundle();

            // se solicitado a minificação...
            if (production) {

                // aplique o seguinte plugin:
                // 1 - minifica o arquivo js final
                scripts = scripts.pipe(minifyStream({ sourceMap: false }));
            }

            scripts = scripts.pipe(source(`${appName}.min.js`))
                .pipe(buffer());

            scripts = scripts.pipe(gulp.dest(dest.js));

            streamJs = scripts;
        }

        return streamJs;
    }

    // realiza processos para gerar os arquivos css
    function css() {

        // 1 - pegue o arquivo sass/scss referente ao app
        // 2 - compile o arquivo para css
        // 3 - aplique atributos compatíveis com a versão de browser especificada na propriedade "browserslist" do arquivo package.json
        // 4 - crie os arquivos e coloque o compilado css na pasta de destino
        // 5 - minifique o arquivo css
        // 6 - renomeie o arquivo minificado
        // 7 - coloque minificado css na pasta de destino
        let css = gulp.src(`${src.sass}/${appName}.{scss,sass}`)
            .pipe(sassCompiler().on('error', sassCompiler.logError))
            .pipe(autoprefixer())
            .pipe(csso())
            .pipe(rename({ extname: '.min.css' }))
            .pipe(gulp.dest(dest.css));

        if (uploadFiles) {

            // aplique a stream de upload de arquivos
            css = upload(css, dest.css);
        }

        return css;
    }
}

// --------------------------------------------------------------------

// ---------------------------- functions -----------------------------

exports['poke-api'] = function poke_api() {

    return compileFiles('poke-api');
}

exports.default = gulp.series(exports['poke-api']);

// --------------------------------------------------------------------