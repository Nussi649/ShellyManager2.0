###### Anleitung für Docker-Container-Updates ######

	! Sicherstellen, dass alle relevanten Änderungen am Code abgeschlossen sind. !

1. Neues Docker-Image erstellen:
	- (command shell) Navigiere in das Verzeichnis mit der Dockerfile.prod.
	- Erstelle das neue Docker-Image:
		docker build -f Dockerfile.prod -t electricity-v2:latest .
		
2. Vor dem Update:
	- Kopie der Datenbank sichern.
	- Warte auf das nächste Zählintervall, bevor du mit dem Update beginnst.
	
3. Update:
	in Docker Manager:
	- Menüpunkt Projekt -> Projekt auswählen -> Stoppen
	wenn Projekt gestoppt:
	- Projekt auswählen -> Menüerweiterung (drei Punkte) -> Build -> Akzeptieren
	Projekt sollte dann nach dem Builden gleich laufen

4. Service starten:
	im Browser:
	- http://sri-storage.local:3030/device/ aufrufen
	- auf Button "Start" klicken
	- reguläres Verhalten sicherstellen

5. Nachbereitung:
	- Datenbank aufräumen, Inkrement Index setzen mit
		ALTER TABLE meter_readings AUTO_INCREMENT = neuer_wert;
	- Änderungen auf Git Repo pushen