from sklearn.metrics import confusion_matrix
from sklearn.preprocessing import LabelEncoder
import onnx
import onnxruntime
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import argparse
import pandas as pd
import os


def to_numpy(tensor):
    return tensor.detach().cpu().numpy() if tensor.requires_grad else tensor.cpu().numpy()


def train_label_encoder(data_file):
    df = pd.read_csv(data_file)
    labels = df["Label"].values
    label_encoder = LabelEncoder()
    label_encoder.fit(labels)
    return label_encoder


def plot_confusion_matrix(train_file, test_file, model_path):
    label_encoder = train_label_encoder(train_file)

    onnx_model = onnx.load(model_path)
    onnx.checker.check_model(onnx_model)
    ort_session = onnxruntime.InferenceSession(model_path)

    df_test = pd.read_csv(test_file)
    X_test = df_test.drop(columns=["Label"])
    Y_test = df_test["Label"]

    X_test = X_test.values.astype(np.float32)

    logits = ort_session.run(None, {'input': X_test})[0]

    preds = np.argmax(logits, axis=1)
    preds = label_encoder.inverse_transform(preds)

    conf_matrix = confusion_matrix(Y_test, preds)
    classes = label_encoder.classes_
    del_index = np.where(classes == "Delete")
    sub_index = np.where(classes == "Submit")
    classes_x = classes.copy()
    classes_x[del_index] = "D\ne\nl\ne\nt\ne"
    classes_x[sub_index] = "S\nu\nb\nm\ni\nt"

    plt.figure(figsize=(22, 16))
    sns.heatmap(conf_matrix, cmap='Blues',
                xticklabels=classes_x,
                yticklabels=classes,
                annot=False)

    plt.xlabel('Predicted Labels', fontsize=17)
    plt.ylabel('True Labels', fontsize=17)
    plt.title('Confusion Matrix', fontsize=24)

    ax = plt.gca()
    ax.set_xticklabels(ax.get_xticklabels(), fontweight='bold', fontsize=16)
    ax.set_yticklabels(ax.get_yticklabels(), fontweight='bold',
                       fontsize=16, rotation=0, va='center')

    results_path = os.path.join('..', 'results')
    if not os.path.exists(results_path):
        os.makedirs(results_path)
    plt.savefig(f"{results_path}/cf_mlp_lermo.png", format='png')
    print(
        f"Confusion matrix saved as cf_lermo.png at {os.path.abspath(results_path)}")


def main():
    parser = argparse.ArgumentParser(
        description='Plot confusion matrix for a model.')
    parser.add_argument('train_file', type=str,
                        help='Path to the CSV training data file')
    parser.add_argument('test_file',  type=str,
                        help='Path to the CSV testing data file')
    parser.add_argument('model_path', type=str,
                        help='Path to the ONNX model file')

    args = parser.parse_args()
    plot_confusion_matrix(args.train_file, args.test_file, args.model_path)


if __name__ == "__main__":
    main()
