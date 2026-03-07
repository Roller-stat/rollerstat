import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
}

async function findPort(startPort, maxPort) {
  for (let port = startPort; port <= maxPort; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) {
      return port;
    }
  }
  return null;
}

function findEphemeralPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error) => {
      reject(error);
    });

    server.once('listening', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Unable to resolve ephemeral port')));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });

    server.listen(0, '0.0.0.0');
  });
}

async function main() {
  const preferred = Number.parseInt(process.env.ADMIN_PORT || '3001', 10);
  const maxPort = Number.parseInt(process.env.ADMIN_MAX_PORT || String(preferred + 20), 10);
  let port = await findPort(preferred, maxPort);

  if (port === null) {
    port = await findEphemeralPort();
    console.log(`No free port in ${preferred}-${maxPort}. Using random free port ${port}.`);
  } else if (port !== preferred) {
    console.log(`Port ${preferred} is busy. Starting admin on ${port}.`);
  }

  console.log(`Admin URL: http://localhost:${port}/admin`);

  const adminCwd = path.resolve(process.cwd(), 'apps/admin');
  const child = spawn('next', ['dev', '-p', String(port)], {
    cwd: adminCwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      ADMIN_PORT: String(port),
    },
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
