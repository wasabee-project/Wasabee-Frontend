# Load order
Template files are loaded in the following order:
```
Master
[languages]
```
Any templates in the languages overwrite those in the master.

It is safe to copy a file from master into a language and edit it in each language

## REQUIRED Telegram Templates
```
default
help
InitOneFail
InitOneSuccess
InitTwoFail
InitTwoSuccess
TeamStateChange
```

## REQUIRED Core Templates
```
Target
Message
```
