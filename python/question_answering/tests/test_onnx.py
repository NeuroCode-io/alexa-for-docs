import json
from question_answering.predict import main
import azure.functions as func


def test_happy_path():
    req = func.HttpRequest(
        method="POST",
        url="/api/predict",
        body=json.dumps(
            {
                "context": "Extractive Question Answering is the task of extracting an answer from a text given a question. An example of a question answering dataset is the SQuAD dataset, which is entirely based on that task. If you would like to fine-tune a model on a SQuAD task, you may leverage the `run_squad.py`.",
                "question": "What is extractive question answering?",
            }
        ).encode("utf-8"),
    )

    resp = main(req)
    json_resp = json.loads(resp.get_body())

    assert json_resp["score"]
    assert json_resp["answer"]
    assert len(json_resp) == 2 # two keys in JSON


def test_question_not_given():
    req = func.HttpRequest(
        method="POST",
        url="/api/predict",
        body=json.dumps(
            {
                "context": "Extractive Question Answering is the task of extracting an answer from a text given a question. An example of a question answering dataset is the SQuAD dataset, which is entirely based on that task. If you would like to fine-tune a model on a SQuAD task, you may leverage the `run_squad.py`.",
                "bks": "What is extractive question answering?",
            }
        ).encode("utf-8"),
    )

    resp = main(req)

    assert resp.status_code == 400


def test_context_not_given():
    req = func.HttpRequest(
        method="POST",
        url="/api/predict",
        body=json.dumps(
            {
                "hkl": "Extractive Question Answering is the task of extracting an answer from a text given a question. An example of a question answering dataset is the SQuAD dataset, which is entirely based on that task. If you would like to fine-tune a model on a SQuAD task, you may leverage the `run_squad.py`.",
                "question": "What is extractive question answering?",
            }
        ).encode("utf-8"),
    )

    resp = main(req)

    assert resp.status_code == 400


def test_long_context():
    req = func.HttpRequest(
        method="POST",
        url="/api/predict",
        body=json.dumps(
            {
                "context": f"Versioning Process Managers 119 state things that will be needed by the new version of the process. In the previous case there was an identifier on a message that the old version did not care about but the new one does. When the new version gets replayed, it will see that message and be able to take whatever it wants out of it to apply to its own state. Unfortunately everything is not puppies and rainbows. There is inherent"
                f'complexity in bringing a new version of a Process Manager to continue from an old version of the Process Manager. The new version must be able to understand all the possible event streams that result from the previous version, or at least what it cares about. Often times this is not a huge problem but it depends how different the processes are between the two versions. This can result in a large amount of conditional logic for how to handle continuing on the new process where the old process had left off. This versioning of Event Sourced Process Managers is often used in conjunction with the Takeover pattern. The old version is signaled that it is to terminate. It can still do anything that it wants as part of its termination and it then raises the "TakeoverRequested" message that will start the new version. The main difference with Event Sourced Process Managers and the pattern is that they do not send state when they ask the new version to Takeover. Warning When versioning Process Managers there are many options. The majority of this chapter however is focused on difficult edge con- ditions. Situations where a running process is changed while it is running should be avoided. All of the cases where a running process is changed while running are niche scenarios, they are included as the topic of the book is versioning. In most circumstances if you are trying to version running Process Managers, you are doing it wrong . Stop and think why it is needed, likely you have a modelling issue. Why does the business want to upgrade the processes in place?'
                f"Whoops, I Did It Again 58 Depending on how you handle subscriptions, you can either send over a Cancelled event with a link back to the original event or you can include the body of the original event in the Cancelled event. These are just semantic differences, as the consumer can get the event data for 54@mystream if it wants to anyway. Both are valid implementations. This is advertising to the consumers that any event can"
                f"possibly be cancelled and if they really care about the cancellation of a previous event beyond notifying someone, they really should handle the Cancelled event. How Do I Find What Needs Fixing? This is one of the biggest struggles for people in Event Sourced systems, especially those who may be new to Event Sourcing. We can send a compensating action, but how do we figure out which streams need it sent? A commonly heard approach is to bring up a one-off instance of the domain model that will iterate through all of the possibly affected aggregates one by one, emitting the compensation as it finds domain objects that may be affected. This strategy is not a terrible one, but it can run into a few issues. How, for one, does your code know what the IDs of all of the streams of that type are? Assuming that you found a problem in accounts, how do you know all the streams that are accounts? There are ways of working around this, such as using an Announcement Stream that tracks all of the account streams, but this must be in place already. If not, it can be a hurdle. Does your domain object have enough data in it at the moment to actually identify if it is currently having a problem? It is common in Event Sourced systems to have the domain state/aggregate contain only the things requires to maintain the invariants it protects. Quite",
                "question": "How do you version events?",
            }
        ).encode("utf-8"),
    )

    resp = main(req)
    json_resp = json.loads(resp.get_body())

    assert json_resp["score"]
    assert json_resp["answer"]
    assert len(json_resp) == 2

