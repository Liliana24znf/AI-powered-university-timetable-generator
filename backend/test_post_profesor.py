import requests

url = "http://localhost:5000/adauga_profesor"
data = {
    "nume": "Popescu Elena",
    "nivel": "Licenta",
    "tipuri": ["Curs", "Seminar"],
    "discipline": ["Matematică", "Algoritmi"]
}

response = requests.post(url, json=data)
print(response.status_code)
print(response.json())
