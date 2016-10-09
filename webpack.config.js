module.exports = {
    entry: {
        project: './src/client/project.tsx',
        task: './src/client/task.tsx',
        imports: './src/client/imports.tsx'
    },
    output: {
        library: "[name]",
        filename: './src/server/public/[name].bundle.js'
    },
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.tsx', '.js']
    },
    module: {
        loaders: [
            { test: /\.tsx$/, loader: 'ts-loader' }
        ]
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "react-bootstrap": "ReactBootstrap",
        "jquery": "jQuery"
    }
}
