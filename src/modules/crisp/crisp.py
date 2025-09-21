import requests, json, os
from datetime import datetime
from openpyxl import Workbook


def main():
    # Supprimer le fichier s'il existe déjà
    if os.path.exists("conversations.xlsx"):
        os.remove("conversations.xlsx")

    # Créer un nouveau classeur et sélectionner la feuille active
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(
        [
            "Date",
            "Tags",
            "NB Messages",
            "NB répondants",
            "Répondants",
            "Conversation",
            "Numéro de Session",
        ]
    )

    for page in range(1, 100):
        tickets = getTicketsFromPage(str(page), "2024-09-22", "2024-10-22")
        if len(tickets) == 0:
            break
        for ticket in tickets:
            session_id = ticket["session_id"]
            tags = ticket["meta"]["segments"]

            conversation = getConversationDetails(session_id)
            date = convert_timestamp(conversation[0]["timestamp"])
            operateurs_fvae = set()

            messages = ""
            nb_echanges = 0
            for message in conversation:
                msg_from = message["from"]
                msg_type = message["type"]

                if msg_type == "event":
                    pass  # Do nothing
                else:
                    user = ""

                    if msg_from == "user":
                        user = "\n Demandeur >> "
                    else:
                        operateur_fvae = message["user"]["nickname"]
                        operateurs_fvae.add(operateur_fvae)
                        # user = "\n "+ operateur_fvae + " >>>> "
                        user = "\n France VAE >> "

                    messages = messages + user + str(message["content"])
                    nb_echanges += 1

            # Ajouter une nouvelle ligne pour chaque conversation
            sheet.append(
                [
                    date,
                    str(tags),
                    nb_echanges,
                    len(operateurs_fvae),
                    ", ".join(operateurs_fvae),
                    messages,
                    session_id,
                ]
            )

    workbook.save(filename="conversations.xlsx")


def convert_timestamp(timestamp: int) -> str:
    timestamp = timestamp / 1000.0
    dt_object = datetime.utcfromtimestamp(timestamp)
    return dt_object.strftime("%Y-%m-%d %H:%M")


def getTicketsFromPage(page, start, end):
    filter = (
        "?filter_date_start="
        + start
        + "T00:00:00.000Z&filter_date_end="
        + end
        + "T00:00:00.000Z"
    )
    crisp_url = URLXXX + "conversations/" + page + filter
    return callCrispAPI(crisp_url)


def getConversationDetails(session_id):
    crisp_url = URLXXX + session_id + "/messages"
    return callCrispAPI(crisp_url)


def callCrispAPI(crisp_url):
    r = requests.get(
        url=crisp_url,
        headers={"Authorization": API_KEYXXX, "X-Crisp-Tier": "plugin"},
    )
    data = r.json()
    return data["data"]


main()
