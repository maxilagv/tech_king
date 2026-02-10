## Setear admin claim (Firebase Auth)

Requisito: bajar un **Service Account** desde Firebase Console:
Project Settings -> Service Accounts -> Generate new private key.

Guardalo como `serviceAccountKey.json` en la raiz del proyecto.
El archivo esta ignorado por git en `.gitignore`.

Ejecuta:
```
node scripts/setAdminClaim.js GauPQvDIhPWfAvlu55CwmfLB15k1
```

Despues de correr el script:
1. Cerrar sesion en el panel.
2. Volver a iniciar sesion para refrescar el token.

Verificacion opcional:
```
node scripts/setAdminClaim.js <uid>
```
