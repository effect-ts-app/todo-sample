#!/bin/bash

git submodule init
cd libs
git sparse-checkout set packages
