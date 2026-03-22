# Web de contador (GitHub Pages)

Proyecto estatico con:

- contador de 1 hora
- boton para iniciar el contador
- persistencia en `localStorage` para mantener el estado al recargar
- descarga de fichero `.txt` al iniciar con hora de inicio y fin prevista

## Importante sobre GitHub Pages

GitHub Pages no permite escribir archivos en el servidor desde JavaScript del navegador.  
Por eso, el "guardado en fichero de texto" se resuelve descargando un `.txt` en el equipo del usuario al iniciar el contador.

## Publicar en GitHub Pages

1. Sube los archivos al repositorio.
2. En GitHub, ve a **Settings > Pages**.
3. En **Build and deployment**, selecciona:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (o la rama que uses), carpeta `/ (root)`
4. Guarda y espera el despliegue.
