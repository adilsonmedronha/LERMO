from sklearn.preprocessing import LabelEncoder, OneHotEncoder
import pandas as pd
from torch.utils.data import Dataset
import torch


class LERMO_Dataset(Dataset):
    def __init__(self, data_file, 
                 selected_classes=None, 
                 balanced=False, 
                 samples_per_class=125, 
                 args=None, isTrain=True):
        
        super().__init__()
        print("Loading dataset...")

        self.df = pd.read_csv(data_file)

        selected_classes = selected_classes.split(
            ",") if selected_classes else []
        if len(selected_classes) > 0:
            print(f"selected classes: {selected_classes}")
            self.df = self.df[self.df["Label"].isin(selected_classes)]

        if balanced:
            self.df = self.df.groupby("Label").head(
                self.df["Label"].value_counts().min())

        if samples_per_class > 0:
            self.df = self.df.groupby('Label', group_keys=False).apply(
                lambda x: x.sample(min(len(x), samples_per_class), random_state=42))

        if "Actor" in (self.df.columns):
            self.df = self.df.drop(columns=["Actor"])

        if isTrain:
            print("Saving train.csv...")
            self.df.to_csv(f"{args.log_file_path}/train.csv", index=False)

        self.data = self.df.drop(columns=["Label", "Actor"]).values
        self.labels = self.df["Label"].values

        self.label_encoder = LabelEncoder()
        self.label_encoder.fit(self.labels)
        self.num_classes = len(self.label_encoder.classes_)
        self.onehot_encoder = OneHotEncoder(sparse=False)
        self.onehot_encoder.fit(
            self.label_encoder.transform(self.labels).reshape(-1, 1))

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        data = self.data[idx]
        label = self.labels[idx]
        label_encoded = self.label_encoder.transform([label])[0]
        onehot_label = torch.tensor(
            self.onehot_encoder.transform([[label_encoded]]))
        return data, onehot_label
