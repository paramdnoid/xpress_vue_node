## todo
- Upload-Status-Anzeige & Notification-System!


2. Sicherheit
	•	Token­speicherung & XSS
└ Du legst das Access-Token in localStorage ab → XSS-Angriff könnte es auslesen. Besser wären httpOnly-Cookies.
	•	CSRF
└ withCredentials: true erlaubt Cookies, aber wenn du Cookies nutzt, brauchst du einen CSRF-Schutz (z. B. Double-Submit-Cookie oder CSRF-Header).
	•	Token-Refresh
└ Beim 401-Interceptor: !originalRequest._retry verhindert Endlosschleife, aber bei mehreren gleichzeitigen 401-Responses kann der Refresh mehrfach angestoßen werden. Besser: alle wartenden Requests in eine Queue packen und nach einmaligem Refresh gemeinsam neu abfeuern.

	2.	Composable für Drag-&-Drop erstellen, um Wiederholung zu vermeiden.
	3.	Test-Suiten aufsetzen (Store + Composables + E2E für Upload).
	4.	Token-Speicherung auf httpOnly-Cookie umstellen und CSRF-Schutz ergänzen.