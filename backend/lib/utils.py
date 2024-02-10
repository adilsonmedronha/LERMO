import os
import cv2
import copy
import string
import shutil
import random
import itertools
import numpy as np
import pandas as pd
from tqdm import tqdm
import mediapipe as mp
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
import argparse

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_hands = mp.solutions.hands


def plot_tsne_viz(X_tsne, Y, classes):
    class_colors = {}
    for letter in classes:
        r, g, b = random.random(), random.random(), random.random()
        class_colors[letter] = (r, g, b)

    Y_train_colors = [class_colors[c[0]] for c in Y.values]
    scatter = plt.scatter(X_tsne[:, 0], X_tsne[:, 1], c=Y_train_colors)
    handles = [plt.plot([], [], marker="o", ls="", color=color)[0]
               for color in class_colors.values()]
    labels = list(class_colors.keys())
    plt.legend(handles, labels, bbox_to_anchor=(1.02, 1), loc="upper left")
    plt.axis('off')
    plt.show()


def plot_label_distribution(csv_file_path, output_file_path="label_distribution.pdf"):
    df = pd.read_csv(csv_file_path)

    df['Label'] = df['Label'].replace({"Enviar": "Send", "Deletar": "Delete"})
    label_column_name = 'Label'
    label_counts = df[label_column_name].value_counts()
    label_counts = label_counts.sort_values(ascending=False)
    color_palette = sns.color_palette("Set3", len(label_counts))

    plt.figure(figsize=(10, 6))
    ax = sns.countplot(data=df, x=label_column_name,
                       order=label_counts.index, palette=color_palette)
    plt.title("Label Distribution")
    plt.xlabel("Classes")
    plt.ylabel("Frequency")
    ax.set_xticklabels(ax.get_xticklabels(), rotation=45,
                       horizontalalignment='right')
    plt.tight_layout()
    plt.savefig(output_file_path, format="pdf")
    plt.show()


def pre_process_landmark(landmark_list):
    temp_landmark_list = copy.deepcopy(landmark_list)
    base_x, base_y = temp_landmark_list[0]

    for i in range(len(temp_landmark_list)):
        x, y = temp_landmark_list[i]
        temp_landmark_list[i] = [x - base_x, y - base_y]

    temp_landmark_list = list(
        itertools.chain.from_iterable(temp_landmark_list))
    max_value = max(abs(value) for value in temp_landmark_list)
    temp_landmark_list = [value / max_value for value in temp_landmark_list]
    return temp_landmark_list


def capture_landmarks(hands, image, img_id, img_class, path2save_img):
    image.flags.writeable = False
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = cv2.flip(image, 1)
    results = hands.process(image)
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    if not os.path.exists(path2save_img):
        os.mkdir(path2save_img)
        print(os.path.exists(path2save_img))

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            no_landmark_path = os.path.join(
                path2save_img, f"{img_class}_{img_id}.jpg")
            print(no_landmark_path)
            cv2.imwrite(no_landmark_path, image)
            flipped = cv2.flip(image, 1)
            inverted_path = os.path.join(
                path2save_img, f"{img_class}_{img_id}_inverted.jpg")
            cv2.imwrite(inverted_path, flipped)

            mp_drawing.draw_landmarks(image, hand_landmarks, 
                                      mp_hands.HAND_CONNECTIONS, 
                                      mp_drawing_styles.get_default_hand_landmarks_style(
            ), mp_drawing_styles.get_default_hand_connections_style())

            image_height, image_width, _ = image.shape
            x_i = [[min(int(landmark.x * image_width), image_width - 1),
                    min(int(landmark.y * image_height), image_height - 1)] 
                    for landmark in hand_landmarks.landmark]

            x_i_normalized = pre_process_landmark(x_i)
            x, y = x_i_normalized[0], x_i_normalized[1]
            cv2.putText(image, 'pixel coordinates: ' + str(x) + " " + str(y) + "   " +
                        img_class, (1300, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            with_landmark_path = os.path.join(
                path2save_img, f"{img_class}_{img_id}_landmarks.jpg")
            print(with_landmark_path)
            cv2.imwrite(with_landmark_path, image)
        return np.array(x_i_normalized), image
    else:
        return None, image


def plot_decision_boundary(clf, X, y):
    x_min, x_max = X[:, 0].min() - 0.1, X[:, 0].max() + 0.1
    y_min, y_max = X[:, 1].min() - 0.1, X[:, 1].max() + 0.1
    xx, yy = np.meshgrid(np.linspace(x_min, x_max, 100),
                         np.linspace(y_min, y_max, 100))

    Z = clf.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    plt.contourf(xx, yy, Z, alpha=0.4, cmap='viridis')
    plt.scatter(X[:, 0], X[:, 1], c=y, alpha=0.8, cmap='viridis')
    plt.colorbar()
    plt.show()
    plt.close()


def augment_images(path_to_load, path_to_save):
    for root, dirs, files in os.walk(path_to_load):
        for file_name in tqdm(files):
            if file_name[-4:] not in [".png", ".jpg"]:
                continue

            img_path = os.path.join(root, file_name)

            img = cv2.imread(img_path)

            for angle in range(-30, 60, 20):
                rotation_matrix = cv2.getRotationMatrix2D(
                    (img.shape[1]/2, img.shape[0]/2), angle, 1)
                img_rotated = cv2.warpAffine(
                    img, rotation_matrix, (img.shape[1], img.shape[0]))
                img_rotated_flipped = cv2.flip(img_rotated, 1)

                cv2.imwrite(os.path.join(
                    path_to_save, f'{file_name[:-4]}_r_{angle}.jpg'), img_rotated)
                cv2.imwrite(os.path.join(
                    path_to_save, f'{file_name[:-4]}_rf_{angle}.jpg'), img_rotated_flipped)

            rows, cols = img.shape[:2]
            pts1 = np.float32(
                [[0, 0], [cols - 1, 0], [cols - 1, rows - 1], [0, rows - 1]])
            pts2 = np.float32([[cols * 0.15, rows * 0.15], [cols *
                              0.85, rows * 0.15], [cols - 1, rows - 1], [0, rows - 1]])
            M = cv2.getPerspectiveTransform(pts1, pts2)
            img_persp_forward = cv2.warpPerspective(img, M, (cols, rows))

            rows, cols = img.shape[:2]
            pts1 = np.float32(
                [[0, 0], [cols - 1, 0], [cols - 1, rows - 1], [0, rows - 1]])
            pts2 = np.float32(
                [[0, 0], [cols - 1, 0], [cols * 0.85, rows * 0.85], [cols * 0.15, rows * 0.85]])
            M = cv2.getPerspectiveTransform(pts1, pts2)
            img_persp_backward = cv2.warpPerspective(img, M, (cols, rows))

            cv2.imwrite(os.path.join(
                path_to_save, f'{file_name[:-4]}_pf.jpg'), img_persp_forward)
            cv2.imwrite(os.path.join(
                path_to_save, f'{file_name[:-4]}_pb.jpg'), img_persp_backward)


def visualization(img_path, path_to_save, cartesian_plot=False, shuffle=True):
    hands = mp.solutions.hands.Hands(
        static_image_mode=True, max_num_hands=2, min_detection_confidence=0.5)

    for root, dirs, files in os.walk(img_path):
        if shuffle:
            random.shuffle(files)
            n_images = 1
            files = files[:n_images]
        for i, filename in enumerate(files):
            path_to_loadimg = os.path.join(root, filename)

            if path_to_loadimg[-4:] not in [".png", ".jpg"]:
                continue

            image = cv2.imread(path_to_loadimg)
            results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    image,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing_styles.get_default_hand_landmarks_style(),
                    mp_drawing_styles.get_default_hand_connections_style()
                )

            path_to_save_img = os.path.join(path_to_save, filename)
            cv2.imwrite(path_to_save_img, image)

            if cartesian_plot:
                for hand_world_landmarks in results.multi_hand_world_landmarks:
                    mp_drawing.plot_landmarks(
                        hand_world_landmarks, mp_hands.HAND_CONNECTIONS, azimuth=5)
    hands.close()


def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv_dataset_path", type=str, default="data.csv")
    parser.add_argument("--csv_test_dataset_path",
                        type=str, default="data.csv")
    parser.add_argument("--batch_size", type=int, default=64)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--device", type=str, default="cuda")
    parser.add_argument("--log_file_path", type=str, default="log")
    parser.add_argument("--train_ratio", type=float, default=0.8)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--input_size", type=int, default=42)
    parser.add_argument("--hidden_size", type=int, default=100)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--selected_classes", type=str, default=None)
    parser.add_argument("--samples_per_class", type=int, default=400)
    parser.add_argument("--balanced", type=bool, default=False)
    parser.add_argument("--model_dir", type=str, default="experiments")
    parser.add_argument("--run_name", type=str)
    args = parser.parse_args()
    return args
