const languageConfigs = {
    cpp:{
        fileName: "main.cpp",
        compileCmd: (dir) => ["g++",`${dir}/main.cpp`,"-o",`${dir}/main`],
        runCmd: (dir) => [`${dir}/main`],
        memoryLimitKB: 262144
    },
    python:{
        fileName: "main.py",
        compileCmd: null,
        runCmd: (dir) => ["python3",`${dir}/main.py`],
        memoryLimitKB: 262144
    },
    javascript:{
        fileName: "main.js",
        compileCmd: null,
        runCmd: (dir) => ["node","--max-old-space-size=128",`${dir}/main.js`],
        memoryLimitKB: 393216
    },
    java:{
        fileName: "Main.java",
        compileCmd: (dir) => ["javac",`${dir}/Main.java`],
        runCmd: (dir) => ["java","-Xmx128m","-XX:+UseSerialGC",
        "-XX:ReservedCodeCacheSize=64m","-XX:MaxMetaspaceSize=64m","-cp",dir,"Main"],
        memoryLimitKB: 524288
    }
};

module.exports = {
    languageConfigs
};