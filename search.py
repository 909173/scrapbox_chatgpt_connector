from make_index import VectorStore

if __name__ == "__main__":
    # Sample default arguments for update_from_scrapbox()
    INDEX_FILE = "mastodon-document.pickle"
    vs = VectorStore(INDEX_FILE)
    text = " When developing a mastodon app and creating a toot timeline, please create a toot type definition in TS"
    score = vs.find_similar_docs(text)
    print(score)