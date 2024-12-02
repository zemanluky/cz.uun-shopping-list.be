# UUN - Shopping list BE

BE část semestrálního projektu vytvoření nákupního seznam na UUN. 

- [Struktura projektu](#project-structure)
- [Prerekvizity](#preparation)
- [Spuštění projektu](#project-configuration)
    - [1. Lokální .env secrets](#project-configuration_local-environment)
    - [2. Build](#project-configuration_build)

<a name="project-structure"></a>
## Struktura projektu

Zde si můžete projít hrubou strukturu projektu, aby bylo jasné kde co hledat. Jsou vytažené nejdůležitější složky a
logické celky.

````Shell
cz.pilsco.skynet
├─📂 docker # related docker configuration files, such as Dockerfiles and nginx site/server conf
├─📂 src # contains code of all microservices
│    ├─📂 controller # all express js controllers are defined here
│    ├─📂 error # application errors which are automatically transformed to json responses
│    ├─📂 helper # helper functions and types
│         ├─📃 error.handler.ts # Global error handler for express. Automatically transforms exception from any handler.
│         ├─📃 jwt.service.ts # Functions for signing and verifying JWT tokens.
│         ├─📃 mongo.connector.ts # Function for connecting to the MongoDB database via mongoose pkg
│         ├─📃 request.guard.ts # Functions for guarding the requests from unauthenticated or unauthorized users.
│         ├─📃 request.validator.ts # Functions for validating and transforming request body, parameters or query parameters.
│         └─📃 response.helper.ts # Functions for sending structured responses.
│    ├─📂 schema # definitions for mongoose schemas and zod validation schemas
│    ├─📂 service # business layer functions
│    └─📂 utils # utilities (functions) that help with common tasks such as exporting data, reused validation schemas, pagination, etc...
├─📂 test # contains test scripts & exported postman collection
├─📂 types # contains global type definitions
└─📃 docker-compose.yml # Docker configuration for this project
````

<a name="preparation"></a>
## Prerekvizity

Před spuštěním a prácí s projektem je potřeba mít lokálně nainstalované následující tools:

- Package manager, bundler - [Bun](https://bun.sh/docs)
- Kontejnerizace - [Docker + docker compose](https://www.docker.com/)

V případě, že používáte Windows, je ideální projekt spouštět ve WSL2.


<a name="project-configuration"></a>
## Příprava spuštění projektu

Na projektu je připravena Docker Compose konfigurace pro jednoduché spuštění všech potřebných součástí.
Nicméně před samotným spuštěním je potřeba nakopírovat environment secrets.

<a name="project-configuration_local-environment"></a>
### 1. Environment secrets

Pro korektní spuštění projektu si musíte připravit lokální .env soubor. Prvně si nakopírujte vzorový soubor
``.env.example`` do souboru ``.env``. Následně si vymyslete nebo vygenerujte dostatečně silný a dlouhý secret, kterým
se budou signovat JWT tokeny.

````Shell
# copy the example file to new .env file
cp .env.example .env

# generate a new secret, for example, with pwgen
pwgen -sy 28 1
````

Nyní můžete zapsat vygenerovanou hodnotu do souboru ``.env`` do proměnné ``JWT_SECRET``.

<a name="project-configuration_build"></a>
### 2. Build

Pro rozjetí projektu lokálně pak pouze stačí v rootu projektu použit následující příkaz.

````shell
docker compose up

# if you need to rebuild the application
docker compose build 
````

Nyní byste měli mít lokálně projekt rozjetý. Server běží na [http://127.0.0.1/](http://127.0.0.1/).

