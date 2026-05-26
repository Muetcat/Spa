<?php
session_start();

$base_dir = __DIR__;
$lock_file = $base_dir . '/setup.lock';
$config_file = $base_dir . '/config/db.php';
$sql_schema = $base_dir . '/database/susyestetic.sql';

$is_locked = file_exists($lock_file);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json; charset=utf-8');
    
    // Si está bloqueado y no enviaron force_reinstall, abortar
    if ($is_locked && empty($_POST['force_reinstall'])) {
        echo json_encode(['ok' => false, 'message' => 'La instalación ya fue completada. Elimina el archivo setup.lock para continuar.']);
        exit;
    }

    $action = $_POST['action'] ?? '';

    if ($action === 'test_connection') {
        $host = $_POST['host'] ?? '';
        $port = $_POST['port'] ?? '';
        $user = $_POST['user'] ?? '';
        $pass = $_POST['pass'] ?? '';

        try {
            $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 3 // timeout corto para el test
            ]);
            echo json_encode(['ok' => true, 'message' => '¡Conexión exitosa al servidor MySQL!']);
        } catch (PDOException $e) {
            echo json_encode(['ok' => false, 'message' => 'Error de conexión: ' . $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'run_setup') {
        $host = $_POST['host'] ?? '';
        $port = $_POST['port'] ?? '';
        $user = $_POST['user'] ?? '';
        $pass = $_POST['pass'] ?? '';
        $dbname = $_POST['dbname'] ?? 'susyestetic';
        
        $logs = [];
        $addLog = function($msg, $isError = false) use (&$logs) {
            $logs[] = ['msg' => $msg, 'error' => $isError];
        };

        try {
            $addLog("Conectando al servidor MySQL...");
            $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_EMULATE_PREPARES => true
            ]);
            
            $addLog("MySQL conectado. Verificando base de datos '{$dbname}'...");
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;");
            $pdo->exec("USE `{$dbname}`;");
            
            $addLog("Base de datos seleccionada. Ejecutando esquema principal...");
            if (file_exists($sql_schema)) {
                $sql = file_get_contents($sql_schema);
                // Reemplazos de seguridad por si cambian el nombre de la DB
                $sql = str_ireplace('USE susyestetic;', "USE `{$dbname}`;", $sql);
                $sql = str_ireplace('CREATE DATABASE IF NOT EXISTS susyestetic', "CREATE DATABASE IF NOT EXISTS `{$dbname}`", $sql);
                
                $pdo->exec($sql);
                $addLog("Esquema principal e información base importados exitosamente.");
            } else {
                throw new Exception("No se encontró el archivo de esquema: {$sql_schema}");
            }
            
            $addLog("Actualizando archivo de configuración (config/db.php)...");
            
            $new_config = "<?php\n" . 
            "/* ── Configuración de la base de datos ──────────────────────\n" .
            "   Generado automáticamente por setup.php\n" . 
            "──────────────────────────────────────────────────────────── */\n" .
            "define('DB_HOST',    '" . addslashes($host) . "');\n" .
            "define('DB_PORT',    '" . addslashes($port) . "');\n" .
            "define('DB_NAME',    '" . addslashes($dbname) . "');\n" .
            "define('DB_USER',    '" . addslashes($user) . "');  \n" .
            "define('DB_PASS',    '" . addslashes($pass) . "');       \n" .
            "define('DB_CHARSET', 'utf8mb4');\n\n" .
            "// Configuración de PayPal\n" .
            "define('PAYPAL_CLIENT_ID', 'test'); // Sandbox client ID por defecto\n" .
            "define('PAYPAL_CURRENCY',  'USD');  // Moneda para transacciones\n\n" .

            "/**\n" .
            " * Retorna una conexión PDO singleton.\n" .
            " * Si falla, responde con JSON de error y termina la ejecución.\n" .
            " */\n" .
            "function getDB(): PDO\n" .
            "{\n" .
            "    static \$pdo = null;\n\n" .
            "    if (\$pdo !== null) {\n" .
            "        return \$pdo;\n" .
            "    }\n\n" .
            "    \$dsn = sprintf(\n" .
            "        'mysql:host=%s;port=%s;dbname=%s;charset=%s',\n" .
            "        DB_HOST, DB_PORT, DB_NAME, DB_CHARSET\n" .
            "    );\n\n" .
            "    try {\n" .
            "        \$pdo = new PDO(\$dsn, DB_USER, DB_PASS, [\n" .
            "            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,\n" .
            "            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,\n" .
            "            PDO::ATTR_EMULATE_PREPARES   => false,\n" .
            "        ]);\n" .
            "    } catch (PDOException \$e) {\n" .
            "        http_response_code(400);\n" .
            "        header('Content-Type: application/json; charset=utf-8');\n" .
            "        echo json_encode([\n" .
            "            'ok'             => false,\n" .
            "            'message'        => 'No se pudo conectar a la base de datos. Verifica config/db.php.',\n" .
            "            'setup_required' => true,\n" .
            "            'debug'          => \$e->getMessage(),\n" .
            "        ]);\n" .
            "        exit;\n" .
            "    }\n\n" .
            "    return \$pdo;\n" .
            "}\n";

            if (file_put_contents($config_file, $new_config) === false) {
                throw new Exception("No se pudo escribir en el archivo {$config_file}. Revisa los permisos.");
            }
            
            $addLog("Creando archivo de bloqueo de seguridad...");
            file_put_contents($lock_file, "Bloqueo de instalación - SuSpa\n" . date('Y-m-d H:i:s'));
            
            $addLog("¡Instalación y Configuración completadas con éxito!");
            echo json_encode(['ok' => true, 'logs' => $logs]);

        } catch (Exception $e) {
            $addLog("Error Crítico: " . $e->getMessage(), true);
            echo json_encode(['ok' => false, 'logs' => $logs]);
        }
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Instalador SuSpa</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #12090e;
      --bg-mid: #1e1018;
      --primary: #C8A4A5;
      --accent: #c9a84c;
      --text: #ffffff;
      --text-muted: #a4919d;
      --border-glass: rgba(201, 168, 76, 0.2);
      --font-heading: 'Cormorant Garamond', serif;
      --font-body: 'Lato', sans-serif;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background-color: var(--bg-dark);
      color: var(--text);
      font-family: var(--font-body);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      background-image: radial-gradient(circle at 50% 0%, var(--bg-mid) 0%, var(--bg-dark) 70%);
    }

    h1 {
      font-family: var(--font-heading);
      color: var(--accent);
      font-size: 3rem;
      margin-bottom: 0.5rem;
      text-align: center;
      letter-spacing: 1px;
    }

    p.subtitle {
      color: var(--text-muted);
      margin-bottom: 2rem;
      text-align: center;
      font-size: 1.1rem;
    }

    .container {
      width: 100%;
      max-width: 900px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: rgba(30, 16, 24, 0.6);
      border: 1px solid var(--border-glass);
      backdrop-filter: blur(12px);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }

    .card h2 {
      font-family: var(--font-heading);
      color: var(--primary);
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-glass);
      padding-bottom: 0.5rem;
    }

    .form-group {
      margin-bottom: 1.2rem;
    }

    label {
      display: block;
      margin-bottom: 0.4rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    input[type="text"],
    input[type="number"],
    input[type="password"] {
      width: 100%;
      padding: 0.8rem;
      background: rgba(18, 9, 14, 0.8);
      border: 1px solid var(--border-glass);
      border-radius: 6px;
      color: var(--text);
      font-family: var(--font-body);
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.2);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-family: var(--font-body);
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 1rem;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent) 0%, #b3923c 100%);
      color: var(--bg-dark);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(201, 168, 76, 0.4);
    }

    .btn-primary:disabled {
      background: #555;
      color: #aaa;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--accent);
      color: var(--accent);
    }

    .btn-outline:hover {
      background: rgba(201, 168, 76, 0.1);
    }

    .console {
      background: #0a0508;
      border: 1px solid var(--border-glass);
      border-radius: 8px;
      padding: 1rem;
      height: 350px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .log-line { margin-bottom: 0.3rem; }
    .log-error { color: #ff5555; }
    .log-success { color: #50fa7b; }
    .log-info { color: #f8f8f2; }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.5rem;
      background: rgba(200, 50, 50, 0.1);
      border: 1px solid rgba(200, 50, 50, 0.3);
      border-radius: 6px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    .status-locked { background: rgba(80, 250, 123, 0.2); color: #50fa7b; border: 1px solid #50fa7b; }
    .status-unlocked { background: rgba(255, 184, 108, 0.2); color: #ffb86c; border: 1px solid #ffb86c; }

    #testResult {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .loader {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(0,0,0,0.3);
      border-radius: 50%;
      border-top-color: #000;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <h1>SuSpa</h1>
  <p class="subtitle">Instalador de Base de Datos y Sistema Admin</p>

  <div class="container">
    
    <!-- Panel Izquierdo: Formulario -->
    <div class="card">
      <h2>1. Credenciales de Conexión</h2>
      
      <?php if ($is_locked): ?>
        <div class="status-badge status-locked">Instalación Completada</div>
        <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1rem;">
          El archivo <code>setup.lock</code> existe. Para reinstalar y perder los datos actuales, debes marcar la siguiente casilla:
        </p>
        <div class="checkbox-group">
          <input type="checkbox" id="forceReinstall">
          <label for="forceReinstall" style="margin:0; color:#ffb86c; font-weight:bold;">Forzar reinstalación (Borrará los datos actuales)</label>
        </div>
      <?php else: ?>
        <div class="status-badge status-unlocked">Pendiente de Instalación</div>
      <?php endif; ?>

      <form id="setupForm" style="margin-top: 1rem;">
        <div class="form-group">
          <label for="host">Servidor (Host)</label>
          <input type="text" id="host" value="localhost" required>
        </div>
        <div class="form-group">
          <label for="port">Puerto</label>
          <input type="number" id="port" value="3306" required>
        </div>
        <div class="form-group">
          <label for="user">Usuario</label>
          <input type="text" id="user" value="root" required>
        </div>
        <div class="form-group">
          <label for="pass">Contraseña</label>
          <input type="password" id="pass" value="">
        </div>
        <div class="form-group">
          <label for="dbname">Nombre de la Base de Datos</label>
          <input type="text" id="dbname" value="susyestetic" required>
        </div>

        <button type="button" id="btnTest" class="btn btn-outline">Probar Conexión</button>
        <div id="testResult"></div>

        <button type="submit" id="btnInstall" class="btn btn-primary" <?php echo $is_locked ? 'disabled' : ''; ?>>
          Iniciar Instalación
        </button>
      </form>
    </div>

    <!-- Panel Derecho: Consola y Progreso -->
    <div class="card">
      <h2>2. Progreso de Instalación</h2>
      <div class="console" id="consoleOutput">
        <div class="log-line log-info">Esperando inicio de instalación...</div>
      </div>
      <div id="actionsContainer" style="display: none; margin-top: 1.5rem; gap: 1rem;">
        <a href="index.html" class="btn btn-outline">Ir al Inicio</a>
        <a href="login.html" class="btn btn-primary">Ingresar al Admin</a>
      </div>
    </div>

  </div>

  <script>
    const isLocked = <?php echo $is_locked ? 'true' : 'false'; ?>;
    
    // Elementos
    const form = document.getElementById('setupForm');
    const btnTest = document.getElementById('btnTest');
    const btnInstall = document.getElementById('btnInstall');
    const forceReinstall = document.getElementById('forceReinstall');
    const consoleOutput = document.getElementById('consoleOutput');
    const testResult = document.getElementById('testResult');
    const actionsContainer = document.getElementById('actionsContainer');

    if (forceReinstall) {
      forceReinstall.addEventListener('change', (e) => {
        btnInstall.disabled = !e.target.checked;
      });
    }

    function appendLog(msg, type = 'info') {
      const div = document.createElement('div');
      div.className = `log-line log-${type}`;
      div.textContent = `> ${msg}`;
      consoleOutput.appendChild(div);
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // Probar conexión
    btnTest.addEventListener('click', async () => {
      btnTest.disabled = true;
      testResult.textContent = 'Probando conexión...';
      testResult.style.color = 'var(--text-muted)';
      
      const formData = new URLSearchParams();
      formData.append('action', 'test_connection');
      formData.append('host', document.getElementById('host').value);
      formData.append('port', document.getElementById('port').value);
      formData.append('user', document.getElementById('user').value);
      formData.append('pass', document.getElementById('pass').value);

      try {
        const res = await fetch('', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.ok) {
          testResult.textContent = data.message;
          testResult.style.color = '#50fa7b';
          appendLog(data.message, 'success');
        } else {
          testResult.textContent = data.message;
          testResult.style.color = '#ff5555';
          appendLog(data.message, 'error');
        }
      } catch (err) {
        testResult.textContent = 'Error de red al intentar conectar.';
        testResult.style.color = '#ff5555';
      }
      
      btnTest.disabled = false;
    });

    // Iniciar Instalación
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      btnInstall.disabled = true;
      btnInstall.innerHTML = '<span class="loader"></span> Instalando...';
      consoleOutput.innerHTML = '';
      actionsContainer.style.display = 'none';

      const formData = new URLSearchParams();
      formData.append('action', 'run_setup');
      formData.append('host', document.getElementById('host').value);
      formData.append('port', document.getElementById('port').value);
      formData.append('user', document.getElementById('user').value);
      formData.append('pass', document.getElementById('pass').value);
      formData.append('dbname', document.getElementById('dbname').value);
      if (forceReinstall && forceReinstall.checked) {
        formData.append('force_reinstall', '1');
      }

      try {
        const res = await fetch('', { method: 'POST', body: formData });
        const data = await res.json();
        
        // Mostrar logs
        if (data.logs) {
          data.logs.forEach(log => {
            appendLog(log.msg, log.error ? 'error' : 'success');
          });
        }

        if (data.ok) {
          appendLog("Redirigiendo o puedes ir manualmente a la página de inicio.", 'info');
          btnInstall.innerHTML = 'Instalación Exitosa';
          btnInstall.style.background = '#50fa7b';
          btnInstall.style.color = '#000';
          actionsContainer.style.display = 'flex';
        } else {
          appendLog(data.message || "La instalación falló.", 'error');
          btnInstall.innerHTML = 'Error en Instalación';
          btnInstall.disabled = false;
        }

      } catch (err) {
        appendLog('Excepción de red o servidor: ' + err.message, 'error');
        btnInstall.innerHTML = 'Error';
        btnInstall.disabled = false;
      }
    });

  </script>
</body>
</html>
