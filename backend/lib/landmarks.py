from utils import * 

"""
python landmarks.py ../images/ ../landmarks/ name.csv actor
"""

def generate_keypoints(folder_path, output_dir, csv_name, actor):
    import re
    csv_path = os.path.join(output_dir, csv_name)
    hands = mp.solutions.hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5)
    data_list = []
    for root, dirs, files in os.walk(folder_path):
        for i, filename in enumerate(tqdm(files)):
            path_to_loadimg = os.path.join(root, filename)
            file_class = filename.split("_")[0]
            if path_to_loadimg[-4:] not in [".png", ".jpg"]:
                continue
            image = cv2.imread(path_to_loadimg)
            image_height, image_width, _ = image.shape
            results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            
            if not results.multi_hand_landmarks: 
                os.remove(path_to_loadimg)
                continue

            for hand_landmarks in results.multi_hand_landmarks:
                x_i = [[min(int(landmark.x * image_width), image_width - 1), 
                        min(int(landmark.y * image_height), image_height - 1)] for landmark in hand_landmarks.landmark]
                mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS, mp_drawing_styles.get_default_hand_landmarks_style(), mp_drawing_styles.get_default_hand_connections_style())
                x_i_normalized = pre_process_landmark(x_i) 
                data_list.append([*x_i_normalized, file_class, path_to_loadimg, actor])
            save_image_landmark = os.path.join(output_dir, "images", file_class)
            if not os.path.exists(save_image_landmark):
                os.makedirs(save_image_landmark)
            cv2.imwrite(os.path.join(save_image_landmark, f"{i}_{file_class}.png"), image)
            
    xy = ["x", "y"]
    df = pd.DataFrame(data_list, columns=[*[f'{i // 2}{xy[i % 2]}' for i in range(42)], 'Label', "File_Path","Actor"])
    df.to_csv(csv_path, index=False)
    hands.close()


def main():
    parser = argparse.ArgumentParser(description='Generate keypoints from images.')
    parser.add_argument('folder_path', type=str, help='Path to the folder containing images')
    parser.add_argument('output_dir', type=str, help='Output directory for keypoints and CSV')
    parser.add_argument('csv_name', type=str, help='Name of the output CSV file')
    parser.add_argument('actor', type=str, help='Name of the actor')
    args = parser.parse_args()

    generate_keypoints(args.folder_path, args.output_dir, args.csv_name, args.actor)


if __name__ == '__main__':
    main()