const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const tar = require('tar-fs');
const Semaphore = require("./semaphore")

const { runExec, getSandboxContainer } = require("../docker/containerManager");


const semaphore = new Semaphore(1);


async function executeCode(language, code, config) {

    console.log('Before acquire, currentLock:', semaphore.currentLock);
    await semaphore.acquire();
    console.log('After acquire, currentLock:', semaphore.currentLock);
    const jobid = crypto.randomUUID();
    const localJobDir = path.join(os.tmpdir(), jobid);
    const localFilePath = path.join(localJobDir, config.fileName);
    const containerDir = `/home/coderunner/app/${jobid}`;

    const container = getSandboxContainer();

    try {
        //writing users code in a temporary file on server
        fs.mkdirSync(localJobDir, { recursive: true });
        fs.writeFileSync(localFilePath, code);  

        //make a unique folder inside the container for this job
        await runExec(container, ['mkdir', '-p', containerDir]);

        //copy the code from our machine into that container folder     
        //dockerode needs a tar archive to do this so we use putArchive     
        const tarStream = tar.pack(localJobDir, { entries: [config.fileName] });
        await container.putArchive(tarStream, { path: containerDir });
        //changing name within container to main.cpp
        if (config.compileCmd) {
            const compileResult = await runExec(container, config.compileCmd(containerDir));
            if (compileResult.stderr) {
                return { compileError: compileResult.stderr };
            }
        }


        const runCommand = config.runCmd(containerDir);
        const runResult = await runExec(container, ['sh', '-c', `ulimit -v ${config.memoryLimitKB}; timeout 5 ${runCommand.join(' ')}`]);



        if (runResult.exitCode === 124) {
            return {
                error: "Your program took to long and was stopped"
            }
        }
        return {
            stdout: runResult.stdout,
            stderr: runResult.stderr,
            exitCode: runResult.exitCode,
            stdoutTruncated: runResult.stdoutTruncated,
            stderrTruncated: runResult.stderrTruncated
        };

    }  finally {
        if (fs.existsSync(localJobDir)) fs.rmSync(localJobDir, { recursive: true, force: true });
        await runExec(container, ['rm', '-rf', containerDir]).catch(() => { });
        semaphore.release();
    }
}

module.exports = {
    executeCode
};