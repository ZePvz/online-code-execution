const Docker = require('dockerode');

const docker = new Docker();

async function main() {
  const container = docker.getContainer('my-sandbox');

  const info = await container.inspect();
  console.log('Container status:', info.State.Status);

  const exec = await container.exec({
    Cmd: ['g++', '--version'],
    AttachStdout: true,
    AttachStderr: true
  });

  const stream = await exec.start();

  let stdout = '';
  let stderr = '';

  docker.modem.demuxStream(
    stream,
    { write: (chunk) => { stdout += chunk.toString(); } },
    { write: (chunk) => { stderr += chunk.toString(); } }
  );

  stream.on('end', () => {
    console.log('--- STDOUT ---');
    console.log(stdout);
    console.log('--- STDERR ---');
    console.log(stderr);
  });
}

main().catch((err) => {
  console.error('Something went wrong:', err);
});