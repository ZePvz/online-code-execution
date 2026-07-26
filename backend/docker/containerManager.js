const Docker = require("dockerode");

const docker = new Docker();


const MAX_OUTPUT_SIZE = 100 * 1024;


async function runExec(container,cmd){
    const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr:true
    });

    const stream = await exec.start();

    const output = await new Promise((resolve,reject)=>{
        let stdout = '';
        let stderr = '';
        let stdoutTruncated = false;
        let stderrTruncated = false;


        container.modem.demuxStream(
            stream,
            {write : (chunk) => {
                if(stdout.length < MAX_OUTPUT_SIZE){
                    stdout += chunk.toString();
                    if(stdout.length > MAX_OUTPUT_SIZE){
                        stdout.slice(0,MAX_OUTPUT_SIZE);
                        stdoutTruncated = true;
                    }
                }
                
            }},
            {write : (chunk) => {
                if(stderr.length < MAX_OUTPUT_SIZE){
                    stderr += chunk.toString();
                    if(stderr.length > MAX_OUTPUT_SIZE){
                        stderr.slice(0,MAX_OUTPUT_SIZE);
                        stderrTruncated = true;
                    }
                }
            }},
        );

        stream.on('end',() => resolve({stdout,stderr, stdoutTruncated, stderrTruncate}));
        stream.on('error', reject);

    });
    const inspectResult = await exec.inspect();
    output.exitCode = inspectResult.ExitCode;

    return output;
}


function getSandboxContainer(){
    return docker.getContainer('my-sandbox');
}

module.exports = {runExec, getSandboxContainer};