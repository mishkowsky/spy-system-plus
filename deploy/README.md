
# deploy
1. накатить виртуалку с free-bsd 14.3

   шаги 2-10 взяты с https://mparvin.me/articles/compile_nginx_freebsd/
2. `pkg install pcre`
3. `pkg install wget`
4. скачать исходники nginx `wget https://nginx.org/download/nginx-1.17.0.tar.gz`
5. разархивнуть `tar xzvf nginx-1.17.0.tar.gz`
6. `cd nginx-1.17.0`
7. `./configure --prefix=/home/studs/s471663/deploy/frontend_nginx`
8. `make && make install`
9. `./configure --prefix=/home/studs/s471663/deploy/nginx`
10. `make && make install`
11. настроить ssh на free-bsd
    
    - резрешить логин от рута - прописать `PermitRootLogin yes` в файле `/etc/ssh/sshd_config`
    - резрешить вход по паролю - прописать `PasswordAuthentication yes` в файле `/etc/ssh/sshd_config`

12. пробросить порт 22 на хост машину (ну или как угодно ещё подключиться по ссх к виртуалке)
13. перенести собранные нгинхы на хост (команды для винды)
    `scp -r -P 2225 root@localhost:/home/studs/s471663/deploy/frontend_nginx {PROJECT_ROOT}/deploy`
    `scp -r -P 2225 root@localhost:/home/studs/s471663/deploy/nginx {PROJECT_ROOT}/deploy`

14. проверить настройки бэка: `backend/src/main/resources/application.properties`, пример см. в `deploy/configs/appliaction.properties`
15. проверить настройки фронта: в `frontned/client/lib/api.ts` должно быть `this.baseUrl = baseUrl || import.meta.env.BASE_API_URL || import.meta.env.VITE_API_BASE_URL || "/api";`
16. поднять `frontend` и `backend` в докере (не билдить же вручную лол)
17. из `frontend` достать папку `/usr/share/nginx/html`, поместить её вместо папки `{PROJECT_ROOT}/deploy/frontend_nginx/html`
18. из `backend` достать файл `/app/app.jar`, поместить его в папку `{PROJECT_ROOT}/deploy/backend`
19. содержимое `deploy/configs/frontend_nginx.conf` скопировать в `deploy/frontend_nginx/conf/nginx.conf`
20. содержимое `deploy/configs/main_nginx.conf` скопировать в `deploy/nginx/conf/nginx.conf`
21. `scp -P 2222 -r {PROJECT_ROOT}\deploy s471663@helios.cs.ifmo.ru:/home/studs/s471663/`
22. на гелиосе:
    ```bash
    chmod 777 /home/studs/s471663/deploy/nginx/sbin/nginx
    chmod 777 /home/studs/s471663/deploy/frontend_nginx/sbin/nginx
    java -jar /home/studs/s471663/deploy/backend/app.jar
    /home/studs/s471663/deploy/frontend_nginx/sbin/nginx
    /home/studs/s471663/deploy/nginx/sbin/nginx
    ```
23. на хосте пробросить порт `ssh -p 2222 -N -f s471663@77.234.196.4 -L 9000:localhost:4646` (остальные пробросы (к бэку, фронту напрямую, базе) - по необходимости)

PS в конфигах используются порты:
- 4621 - порт нгинха фронта
- 3954 - порт бэка
- 4646 - порт основного нгинха-роутера

всякие команды
-
```bash
# Копировать папку со всем что есть внутри с виртуалки на хост (2225 - проброс порта на 22) (виндовс команда)
scp -r -P 2225 root@localhost:/home/studs/s471663/frontend_nginx .
```

```bash

# Копировать папку со всем что есть внутри с хоста на гелиос (виндовс команда)
scp -P 2222 -r {PROJECT_ROOT}\deploy s471663@helios.cs.ifmo.ru:/home/studs/s471663/
```

```bash
# Проброс порта на гелиос (виндовс команда)
ssh -p 2222 -N -f s471663@77.234.196.4 -L 8889:localhost:4621
#                          порт локальный -^              ^- порт гелиоса
```

```bash
# посмотреть какие порты заняты текущим юзером на гелиосе 
sockstat -l
```