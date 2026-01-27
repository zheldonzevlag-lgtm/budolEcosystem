// Stub for tflite_flutter on web
class Interpreter {
  static Interpreter fromFile(dynamic file, {dynamic options}) => Interpreter();
  void close() {}
  List<dynamic> getInputTensors() => [];
  List<dynamic> getOutputTensors() => [];
  void run(dynamic input, dynamic output) {}
}

class InterpreterOptions {
  int threads = 1;
}

class Tensor {
  List<int> shape = [];
}

extension Reshape on List {
  List reshape(List<int> shape) {
    return this;
  }
}
