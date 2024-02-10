#!/bin/bash

EPOCHS=1000
NAME=a1-a2-a3-a4-actor5
NAME_EXP=experiments/${NAME}
SELECTED_CLASSES=("A" "B" "C" "D" "E" "F" "G" "H" "I" "J" "K" "L" "M" "N" "O" "P" "Q" "R" "S" "T" "U" "V" "W" "X" "Y" "Z" "DELETAR" "ENVIAR")

PYTHONPATH=$PYTHONPATH:../ python src/train.py \
    --csv_dataset_path="/home/adilson/Git/LERMO/data/merged_A1-A2-A3-A4_normal_sampled.csv" \
    --csv_test_dataset_path="/home/adilson/Git/LERMO/data/test.csv" \
    --batch_size=128 \
    --epochs=$EPOCHS \
    --device=cuda \
    --log_file_path="${NAME_EXP}" \
    --train_ratio=0.8 \
    --lr=1e-4 \
    --input_size=42 \
    --hidden_size=50 \
    --seed=42 \
    --selected_classes= \
    --balanced=false \
    --samples_per_class=500 \
    --model_dir=experiments \
    --run_name=$NAME_EXP